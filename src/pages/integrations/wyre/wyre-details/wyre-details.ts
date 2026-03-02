import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavParams, ViewController } from 'ionic-angular';
import * as _ from 'lodash';

// Providers
import { ExternalLinkProvider } from '../../../../providers/external-link/external-link';
import { Logger } from '../../../../providers/logger/logger';
import { PopupProvider } from '../../../../providers/popup/popup';
import { ThemeProvider } from '../../../../providers/theme/theme';
import { WyreProvider } from '../../../../providers/wyre/wyre';

@Component({
  selector: 'page-wyre-details',
  templateUrl: 'wyre-details.html'
})
export class WyreDetailsPage {
  public paymentRequest;

  constructor(
    private externalLinkProvider: ExternalLinkProvider,
    private logger: Logger,
    private navParams: NavParams,
    private popupProvider: PopupProvider,
    private wyreProvider: WyreProvider,
    private translate: TranslateService,
    private viewCtrl: ViewController,
    public themeProvider: ThemeProvider
  ) {
    this.paymentRequest = this.navParams.data.paymentRequestData;
    this.paymentRequest.fiatBaseAmount = this.paymentRequest.purchaseAmount
      ? this.paymentRequest.purchaseAmount
      : +this.paymentRequest.sourceAmount - +this.paymentRequest.fee;
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: WyreDetailsPage');
  }

  ionViewWillEnter() {
    if (
      this.paymentRequest.orderId &&
      (this.paymentRequest.status != 'success' ||
        !this.paymentRequest.transferId ||
        (this.paymentRequest.transferId &&
          !this.paymentRequest.blockchainNetworkTx))
    ) {
      this.logger.info('Wyre Details: trying to get order details data');
      this.wyreProvider
        .getWalletOrderDetails(this.paymentRequest.orderId)
        .then((orderData: any) => {
          this.logger.debug('Wyre get order details: SUCCESS!');
          this.logger.debug('order Data: ', orderData);
          if (orderData && !_.isEmpty(orderData)) {
            switch (orderData.status) {
              case 'RUNNING_CHECKS':
                this.paymentRequest.status = 'paymentRequestSent';
                break;
              case 'PROCESSING':
                this.paymentRequest.status = 'paymentRequestSent';
                break;
              case 'FAILED':
                this.paymentRequest.status = 'failed';
                break;
              case 'COMPLETE':
                this.paymentRequest.status = 'success';
                break;
              default:
                this.paymentRequest.status = 'paymentRequestSent';
                break;
            }
            this.paymentRequest.sourceAmount = orderData.sourceAmount;
            this.paymentRequest.fee =
              orderData.sourceAmount &&
              orderData.purchaseAmount &&
              orderData.sourceAmount - orderData.purchaseAmount >= 0
                ? orderData.sourceAmount - orderData.purchaseAmount
                : null; // Total fee (crypto fee + Wyre fee)
            this.paymentRequest.destCurrency = orderData.destCurrency;
            this.paymentRequest.sourceCurrency = orderData.sourceCurrency;

            if (orderData.transferId) {
              this.paymentRequest.transferId = orderData.transferId;
              this.logger.info('Wyre Details: trying to get transaction info');
              this.wyreProvider
                .getTransfer(this.paymentRequest.transferId)
                .then((transferData: any) => {
                  this.paymentRequest.blockchainNetworkTx =
                    transferData.blockchainNetworkTx;
                  this.paymentRequest.destAmount = transferData.destAmount;
                  this.saveWyrePaymentRequest();
                })
                .catch(_err => {
                  this.logger.warn(
                    'Could not get transfer for transferId: ' +
                      this.paymentRequest.transferId
                  );
                  this.saveWyrePaymentRequest();
                });
            } else {
              this.saveWyrePaymentRequest();
            }
          }
        })
        .catch(_err => {
          this.logger.warn(
            'Could not get order details for orderId: ' +
              this.paymentRequest.orderId
          );
        });
    }
  }

  private saveWyrePaymentRequest() {
    this.wyreProvider
      .saveWyre(this.paymentRequest, null)
      .then(() => {
        this.logger.debug(
          'Saved Wyre with orderId: ' + this.paymentRequest.orderId
        );
      })
      .catch(() => {
        this.logger.warn('Could not update payment request status');
      });
  }

  public remove() {
    const title = this.translate.instant('Removing Payment Request Data');
    const message = this.translate.instant(
      "The data of this payment request will be deleted. Make sure you don't need it"
    );
    const okText = this.translate.instant('Remove');
    const cancelText = this.translate.instant('Cancel');
    this.popupProvider
      .ionicConfirm(title, message, okText, cancelText)
      .then((res: boolean) => {
        if (res) {
          this.wyreProvider
            .saveWyre(this.paymentRequest, {
              remove: true
            })
            .then(() => {
              this.close(this.paymentRequest.orderId);
            });
        }
      });
  }

  public openExternalLink(url: string) {
    this.externalLinkProvider.open(url);
  }

  public close(removedPaymentRequest?: string) {
    this.viewCtrl.dismiss({ removedPaymentRequest });
  }
}
