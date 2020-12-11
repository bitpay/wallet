import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavParams, ViewController } from 'ionic-angular';

// Providers
import { ChangellyProvider } from '../../../../providers/changelly/changelly';
import { ExternalLinkProvider } from '../../../../providers/external-link/external-link';
import { Logger } from '../../../../providers/logger/logger';
import { PopupProvider } from '../../../../providers/popup/popup';

@Component({
  selector: 'page-changelly-details',
  templateUrl: 'changelly-details.html'
})
export class ChangellyDetailsPage {
  public swapTxData;
  public statusDescription: string;

  constructor(
    private externalLinkProvider: ExternalLinkProvider,
    private logger: Logger,
    private navParams: NavParams,
    private popupProvider: PopupProvider,
    private changellyProvider: ChangellyProvider,
    private translate: TranslateService,
    private viewCtrl: ViewController
  ) {
    this.swapTxData = this.navParams.data.swapTxData;
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: ChangellyDetailsPage');
  }

  ionViewWillEnter() {
    this.updateStatusDescription();
    this.getStatus();
  }

  private updateStatusDescription() {
    switch (this.swapTxData.status) {
      case 'waiting':
        this.statusDescription = this.translate.instant(
          'Transaction is waiting for an incoming payment.'
        );
        break;
      case 'confirming':
        this.statusDescription = this.translate.instant(
          'We have received payin and are waiting for certain amount of confirmations depending of incoming currency.'
        );
        break;
      case 'exchanging':
        this.statusDescription = this.translate.instant(
          'Payment was confirmed and is being exchanged.'
        );
        break;
      case 'sending':
        this.statusDescription = this.translate.instant(
          'Coins are being sent to the recipient address.'
        );
        break;
      case 'finished':
        this.statusDescription = this.translate.instant(
          'Coins were successfully sent to the recipient address.'
        );
        break;
      case 'failed':
        this.statusDescription = this.translate.instant(
          'Transaction has failed. In most cases, the amount was less than the minimum. Please contact support and provide a transaction id.'
        );
        break;
      case 'refunded':
        this.statusDescription = this.translate.instant(
          "Exchange failed and coins were refunded to user's wallet. The wallet address should be provided by user."
        );
        break;
      case 'hold':
        this.statusDescription = this.translate.instant(
          'Due to AML/KYC procedure, exchange may be delayed'
        );
        break;
      case 'expired':
        this.statusDescription = this.translate.instant(
          'In case payin was not sent within the indicated timeframe'
        );
        break;
      default:
        break;
    }
  }

  public getStatus(force?: boolean) {
    if (this.swapTxData.status == 'finished' && !force) return;
    this.changellyProvider
      .getStatus(this.swapTxData.exchangeTxId)
      .then(data => {
        if (data.error) {
          this.logger.error('Changelly error: ' + data.error.message);
          return;
        }
        console.log('++++++++++++++++getStatus data: ', data);
        if (data.result != this.swapTxData.status) {
          this.swapTxData.status = data.result;
          this.updateStatusDescription();
          this.changellyProvider.saveChangelly(this.swapTxData, {
            status: data.result
          });
        }
      })
      .catch(err => {
        console.log('++++++++++++++++getStatus err: ', err);
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
          this.changellyProvider
            .saveChangelly(this.swapTxData, {
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
