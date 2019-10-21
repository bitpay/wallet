import { Component } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';

// Providers
import { Logger } from '../../../providers';

@Component({
  selector: 'page-coin-selector',
  templateUrl: 'coin-selector.html'
})
export class CoinSelectorPage {
  public description: string;

  constructor(
    private logger: Logger,
    private viewCtrl: ViewController,
    private navParams: NavParams
  ) {
    this.logger.debug('Coin selector initialized;');
    this.description = this.navParams.data.description;
  }

  public selectedCoin(coin?: string): void {
    this.viewCtrl.dismiss({
      selectedCoin: coin
    });
  }
}
