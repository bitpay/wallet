import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavParams, ViewController } from 'ionic-angular';

// Providers
import { ConfigProvider } from '../../../../providers/config/config';
import { ExternalLinkProvider } from '../../../../providers/external-link/external-link';
import { Logger } from '../../../../providers/logger/logger';
import { OneInchProvider } from '../../../../providers/one-inch/one-inch';
import { PopupProvider } from '../../../../providers/popup/popup';

@Component({
  selector: 'page-one-inch-details',
  templateUrl: 'one-inch-details.html'
})
export class OneInchDetailsPage {
  public swapTxData;

  constructor(
    private configProvider: ConfigProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private logger: Logger,
    private navParams: NavParams,
    private popupProvider: PopupProvider,
    private oneInchProvider: OneInchProvider,
    private translate: TranslateService,
    private viewCtrl: ViewController
  ) {
    this.swapTxData = this.navParams.data.swapTxData;
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: OneInchDetailsPage');
  }

  public doRefresh(refresher) {
    this.logger.info('Forcing refresh');

    setTimeout(() => {
      refresher.complete();
    }, 2000);
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
          this.oneInchProvider
            .saveOneInch(this.swapTxData, {
              remove: true
            })
            .then(() => {
              this.close();
            });
        }
      });
  }

  public viewOnBlockchain(): void {
    let defaults = this.configProvider.getDefaults();
    const blockexplorerUrl = defaults.blockExplorerUrl['eth'];

    let url = `https://${blockexplorerUrl}tx/${this.swapTxData.txId}`;
    this.externalLinkProvider.open(url);
  }

  public close() {
    this.viewCtrl.dismiss();
  }
}
