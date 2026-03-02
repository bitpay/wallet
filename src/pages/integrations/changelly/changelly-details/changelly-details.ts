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
  public status;

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
    this.status = this.changellyProvider.getStatusDetails(
      this.swapTxData.status
    );
  }

  public doRefresh(refresher) {
    this.logger.info('Forcing status query');
    this.getStatus(true);

    setTimeout(() => {
      refresher.complete();
    }, 2000);
  }

  public getStatus(force?: boolean) {
    if (this.swapTxData.status == 'finished' && !force) return;
    this.changellyProvider
      .getStatus(this.swapTxData.exchangeTxId, this.swapTxData.status)
      .then(data => {
        if (data.error) {
          this.logger.error('Changelly getStatus Error: ' + data.error.message);
          return;
        }
        if (data.result != this.swapTxData.status) {
          this.logger.debug('Updating status to: ' + data.result);
          this.swapTxData.status = data.result;
          this.updateStatusDescription();
          this.changellyProvider.saveChangelly(this.swapTxData, {
            status: data.result
          });
        }
      })
      .catch(err => {
        this.logger.error('Changelly getStatus Error: ', err);
      });
  }

  public remove() {
    const title = this.translate.instant('Removing Transaction Data');
    const message = this.translate.instant(
      "The data of this exchange will be deleted from your device. Make sure you don't need it"
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
