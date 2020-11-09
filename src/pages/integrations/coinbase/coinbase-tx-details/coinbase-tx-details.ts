import { Component } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';

import { TranslateService } from '@ngx-translate/core';

import { ConfigProvider } from '../../../../providers/config/config';
import { ExternalLinkProvider } from '../../../../providers/external-link/external-link';

@Component({
  selector: 'page-coinbase-tx-details',
  templateUrl: 'coinbase-tx-details.html'
})
export class CoinbaseTxDetailsPage {
  public tx;

  constructor(
    private viewCtrl: ViewController,
    private navParams: NavParams,
    private configProvider: ConfigProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private translate: TranslateService
  ) {
    this.tx = this.navParams.data.tx;
  }

  public viewOnBlockchain(): void {
    const defaults = this.configProvider.getDefaults();
    const blockexplorerUrl =
      defaults.blockExplorerUrl[this.tx.amount.currency.toLowerCase()];
    const btx = this.tx;
    const network = 'mainnet/';
    const url = `https://${blockexplorerUrl}${network}tx/${btx.network.hash}`;
    const optIn = true;
    const title = null;
    const message = this.translate.instant('View Transaction');
    const okText = this.translate.instant('Open');
    const cancelText = this.translate.instant('Go Back');
    this.externalLinkProvider.open(
      url,
      optIn,
      title,
      message,
      okText,
      cancelText
    );
  }

  public close() {
    this.viewCtrl.dismiss();
  }
}
