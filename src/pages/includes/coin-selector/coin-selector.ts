import { Component } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';

// Providers
import { CurrencyProvider, Logger } from '../../../providers';
import { Coin } from '../../../providers/currency/currency';

@Component({
  selector: 'page-coin-selector',
  templateUrl: 'coin-selector.html'
})
export class CoinSelectorPage {
  public description: string;
  public availableChains: string[];

  constructor(
    private currencyProvider: CurrencyProvider,
    private logger: Logger,
    private viewCtrl: ViewController,
    private navParams: NavParams
  ) {
    this.logger.debug('Coin selector initialized;');
    this.description = this.navParams.data.description;
    this.availableChains = this.currencyProvider.getAvailableChains();
  }

  public getCoinName(coin: Coin): string {
    return this.currencyProvider.getCoinName(coin);
  }

  public selectedCoin(coin?: string): void {
    this.viewCtrl.dismiss({
      selectedCoin: coin
    });
  }
}
