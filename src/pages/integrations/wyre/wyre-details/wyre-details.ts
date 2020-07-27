import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavParams, ViewController } from 'ionic-angular';

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
    this.paymentRequest.fiatBaseAmount =
      +this.paymentRequest.sourceAmount - +this.paymentRequest.fee;
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: WyreDetailsPage');
  }

  ionViewWillEnter() {
    if (
      this.paymentRequest.status != 'success' &&
      this.paymentRequest.transferId
    ) {
      this.logger.info('Wyre Details: trying to get transaction info');
      this.wyreProvider
        .getTransfer(this.navParams.data.transferId)
        .then((transferData: any) => {
          this.paymentRequest.status = 'success';
          this.paymentRequest.sourceAmount = transferData.sourceAmount;
          this.paymentRequest.fee = transferData.fee; // Total fee (crypto fee + Wyre fee)
          this.paymentRequest.destCurrency = transferData.destCurrency;
          this.paymentRequest.sourceCurrency = transferData.sourceCurrency;

          this.wyreProvider
            .saveWyre(this.paymentRequest, null)
            .then(() => {
              this.logger.debug(
                'Saved Wyre with transferId: ' + this.navParams.data.transferId
              );
            })
            .catch(() => {
              this.logger.warn('Could not update payment request status');
            });
        })
        .catch(_err => {
          this.logger.warn(
            'Could not get transfer for transferId: ' +
              this.navParams.data.transferId
          );
        });
    }
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
              this.close();
            });
        }
      });
  }

  public openExternalLink(url: string) {
    this.externalLinkProvider.open(url);
  }

  public close() {
    this.viewCtrl.dismiss();
  }
}
