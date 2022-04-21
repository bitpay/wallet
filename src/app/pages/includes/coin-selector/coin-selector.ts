import { Component, ViewEncapsulation } from '@angular/core';
import { ModalController, NavParams } from '@ionic/angular';
import { Coin, CurrencyProvider } from 'src/app/providers/currency/currency';
import { Logger } from 'src/app/providers/logger/logger';

// Providers

@Component({
  selector: 'page-coin-selector',
  templateUrl: 'coin-selector.html',
  styleUrls: ['coin-selector.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CoinSelectorPage {
  public description: string;
  public availableChains: string[];

  constructor(
    private currencyProvider: CurrencyProvider,
    private logger: Logger,
    private viewCtrl: ModalController,
    private navParams: NavParams
  ) {
    this.logger.debug('Coin selector initialized;');
    this.description = this.navParams.data.description;
    this.availableChains = this.currencyProvider.getAvailableChains();
  }

  public getCoinName(coin: Coin | any): string {
    return this.currencyProvider.getCoinName(coin);
  }

  public selectedCoin(coin?: string): void {
    this.viewCtrl.dismiss({
      selectedCoin: coin
    });
  }
}
