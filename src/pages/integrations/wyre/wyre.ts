import { Component } from '@angular/core';
import { ModalController, NavParams } from 'ionic-angular';
import * as _ from 'lodash';

// Pages
import { WyreDetailsPage } from './wyre-details/wyre-details';

// Proviers
import { AnalyticsProvider } from '../../../providers/analytics/analytics';
import { ExternalLinkProvider } from '../../../providers/external-link/external-link';
import { Logger } from '../../../providers/logger/logger';
import { ThemeProvider } from '../../../providers/theme/theme';
import { WyreProvider } from '../../../providers/wyre/wyre';

@Component({
  selector: 'page-wyre',
  templateUrl: 'wyre.html'
})
export class WyrePage {
  public loading: boolean;
  public wyrePaymentRequests: any[];
  public service;

  constructor(
    private analyticsProvider: AnalyticsProvider,
    private logger: Logger,
    private externalLinkProvider: ExternalLinkProvider,
    private modalCtrl: ModalController,
    private navParams: NavParams,
    private wyreProvider: WyreProvider,
    public themeProvider: ThemeProvider
  ) {}

  ionViewDidLoad() {
    this.wyrePaymentRequests = [];
    this.logger.info('Loaded: WyrePage');
  }

  ionViewWillEnter() {
    this.init();
  }

  private init() {
    this.loading = true;
    this.wyreProvider
      .getWyre()
      .then(wyreData => {
        if (!wyreData || _.isEmpty(wyreData)) wyreData = {};

        if (!_.isEmpty(this.navParams.data) && this.navParams.data.orderId) {
          wyreData[this.navParams.data.orderId] = this.navParams.data;
          this.logger.debug('Wyre trying to get order details');
          this.wyreProvider
            .getWalletOrderDetails(this.navParams.data.orderId)
            .then((orderData: any) => {
              this.logger.debug('Wyre get order details: SUCCESS');
              if (orderData && !_.isEmpty(orderData)) {
                switch (orderData.status) {
                  case 'RUNNING_CHECKS':
                    wyreData[this.navParams.data.orderId].status =
                      'paymentRequestSent';
                    break;
                  case 'PROCESSING':
                    wyreData[this.navParams.data.orderId].status =
                      'paymentRequestSent';
                    break;
                  case 'FAILED':
                    wyreData[this.navParams.data.orderId].status = 'failed';
                    break;
                  case 'COMPLETE':
                    wyreData[this.navParams.data.orderId].status = 'success';
                    break;
                  default:
                    wyreData[this.navParams.data.orderId].status =
                      'paymentRequestSent';
                    break;
                }
                wyreData[
                  this.navParams.data.orderId
                ].sourceAmount = orderData.sourceAmount
                  ? orderData.sourceAmount
                  : '';
                wyreData[this.navParams.data.orderId].destAmount = this
                  .navParams.data.destAmount
                  ? this.navParams.data.destAmount
                  : '';
                wyreData[
                  this.navParams.data.orderId
                ].purchaseAmount = orderData.purchaseAmount
                  ? orderData.purchaseAmount
                  : '';
                wyreData[this.navParams.data.orderId].fee =
                  orderData.sourceAmount &&
                  orderData.purchaseAmount &&
                  orderData.sourceAmount - orderData.purchaseAmount >= 0
                    ? orderData.sourceAmount - orderData.purchaseAmount
                    : ''; // Total fee (crypto fee + Wyre fee)
                wyreData[
                  this.navParams.data.orderId
                ].destCurrency = orderData.destCurrency
                  ? orderData.destCurrency
                  : '';
                wyreData[
                  this.navParams.data.orderId
                ].sourceCurrency = orderData.sourceCurrency
                  ? orderData.sourceCurrency
                  : '';

                if (orderData.transferId) {
                  wyreData[this.navParams.data.orderId].transferId =
                    orderData.transferId;
                  this.logger.debug('Wyre trying get transfer');
                  this.wyreProvider
                    .getTransfer(orderData.transferId)
                    .then((transferData: any) => {
                      this.logger.debug('Wyre get transfer: SUCCESS');
                      if (transferData && !_.isEmpty(transferData)) {
                        wyreData[
                          this.navParams.data.orderId
                        ].blockchainNetworkTx = transferData.blockchainNetworkTx
                          ? transferData.blockchainNetworkTx
                          : '';
                        wyreData[
                          this.navParams.data.orderId
                        ].destAmount = transferData.destAmount
                          ? transferData.destAmount
                          : '';

                        this.setWyrePaymentRequests(wyreData);
                        this.saveWyre(
                          wyreData[this.navParams.data.orderId],
                          true
                        );
                      }
                    })
                    .catch(_err => {
                      this.logger.warn(
                        'Could not get transfer for transferId: ' +
                          orderData.transferId
                      );

                      this.setWyrePaymentRequests(wyreData);
                      this.saveWyre(
                        wyreData[this.navParams.data.orderId],
                        true
                      );
                    });
                } else {
                  this.setWyrePaymentRequests(wyreData);
                  this.saveWyre(wyreData[this.navParams.data.orderId], true);
                }
              }
            })
            .catch(_err => {
              this.logger.warn(
                'Could not get order details for orderId: ' +
                  this.navParams.data.orderId
              );

              this.setWyrePaymentRequests(wyreData);
              this.saveWyre(wyreData[this.navParams.data.orderId], false);
            });
        } else {
          this.setWyrePaymentRequests(wyreData);
        }
      })
      .catch(err => {
        this.loading = false;
        if (err) this.logger.error(err);
      });
  }

  private setWyrePaymentRequests(wyreData: any) {
    const wyrePaymentRequests: any = {};
    Object.assign(wyrePaymentRequests, wyreData);
    this.wyrePaymentRequests = Object.values(wyrePaymentRequests);
    this.loading = false;
  }

  private saveWyre(wyreOrderData: any, addToAnalytics?: boolean) {
    this.wyreProvider
      .saveWyre(wyreOrderData, null)
      .then(() => {
        this.logger.debug('Saved Wyre with orderId: ' + wyreOrderData.orderId);
        if (addToAnalytics && wyreOrderData.walletId) {
          this.analyticsProvider.logEvent('buy_crypto_payment_success', {
            exchange: 'wyre',
            userId: wyreOrderData.walletId
          });
        }
      })
      .catch(() => {
        this.logger.warn('Could not update payment request status');
      });
  }

  public openWyreModal(paymentRequestData) {
    const modal = this.modalCtrl.create(WyreDetailsPage, {
      paymentRequestData
    });

    modal.present();

    modal.onDidDismiss(data => {
      if (
        data &&
        this.navParams.data &&
        data.removedPaymentRequest == this.navParams.data.orderId
      ) {
        delete this.navParams.data;
      }
      this.init();
    });
  }

  public openExternalLink(url: string) {
    this.externalLinkProvider.open(url);
  }
}
