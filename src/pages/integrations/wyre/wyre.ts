import { Component } from '@angular/core';
import { ModalController, NavParams } from 'ionic-angular';
import * as _ from 'lodash';

// Pages
import { WyreDetailsPage } from './wyre-details/wyre-details';

// Proviers
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
        if (!_.isEmpty(this.navParams.data) && this.navParams.data.transferId) {
          wyreData[this.navParams.data.transferId] = this.navParams.data;
          this.logger.debug('Wyre trying get transfer');

          this.wyreProvider
            .getTransfer(this.navParams.data.transferId)
            .then((transferData: any) => {
              this.logger.debug('Wyre get transfer: SUCCESS');
              if (transferData && !_.isEmpty(transferData)) {
                wyreData[this.navParams.data.transferId].status = 'success';
                wyreData[
                  this.navParams.data.transferId
                ].sourceAmount = transferData.sourceAmount
                  ? transferData.sourceAmount
                  : '';
                wyreData[this.navParams.data.transferId].fee = transferData.fee
                  ? transferData.fee
                  : ''; // Total fee (crypto fee + Wyre fee)
                wyreData[
                  this.navParams.data.transferId
                ].destCurrency = transferData.destCurrency
                  ? transferData.destCurrency
                  : '';
                wyreData[
                  this.navParams.data.transferId
                ].sourceCurrency = transferData.sourceCurrency
                  ? transferData.sourceCurrency
                  : '';
                wyreData[
                  this.navParams.data.transferId
                ].blockchainNetworkTx = transferData.blockchainNetworkTx
                  ? transferData.blockchainNetworkTx
                  : '';

                this.setWyrePaymentRequests(wyreData);

                this.wyreProvider
                  .saveWyre(wyreData[this.navParams.data.transferId], null)
                  .then(() => {
                    this.logger.debug(
                      'Saved Wyre with transferId: ' +
                        this.navParams.data.transferId
                    );
                  })
                  .catch(() => {
                    this.logger.warn('Could not update payment request status');
                  });
              }
            })
            .catch(_err => {
              this.logger.warn(
                'Could not get transfer for transferId: ' +
                  this.navParams.data.transferId
              );

              this.setWyrePaymentRequests(wyreData);

              wyreData[this.navParams.data.transferId].status =
                'paymentRequestSent';

              this.wyreProvider
                .saveWyre(wyreData[this.navParams.data.transferId], null)
                .then(() => {
                  this.logger.debug(
                    'Saved Wyre with transferId: ' +
                      this.navParams.data.transferId
                  );
                })
                .catch(() => {
                  this.logger.warn('Could not update payment request status');
                });
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

  public openWyreModal(paymentRequestData) {
    const modal = this.modalCtrl.create(WyreDetailsPage, {
      paymentRequestData
    });

    modal.present();

    modal.onDidDismiss(() => {
      this.init();
    });
  }

  public openExternalLink(url: string) {
    this.externalLinkProvider.open(url);
  }
}
