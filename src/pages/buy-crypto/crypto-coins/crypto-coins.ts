import { Component } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';
import * as _ from 'lodash';

// Providers
import { Logger } from '../../../providers/logger/logger';
import { SimplexProvider } from '../../../providers/simplex/simplex';

@Component({
  selector: 'page-crypto-coins',
  templateUrl: 'crypto-coins.html'
})
export class CryptoCoinsPage {
  public coinSelected;
  public supportedCoins;
  constructor(
    private logger: Logger,
    private navParams: NavParams,
    private simplexProvider: SimplexProvider,
    private viewCtrl: ViewController
  ) {
    this.supportedCoins = this.simplexProvider.supportedCoins;
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: CryptoCoinsPage');
  }

  ionViewWillEnter() {
    this.coinSelected = this.navParams.data.coin;
  }

  public close() {
    this.viewCtrl.dismiss();
  }

  public save() {
    if (!this.coinSelected || this.coinSelected == this.navParams.data.coin)
      return;
    this.viewCtrl.dismiss({ coinSelected: this.coinSelected });
  }
}
