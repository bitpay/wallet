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
