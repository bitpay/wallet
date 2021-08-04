import { Component, Input } from '@angular/core';
import { CurrencyProvider } from '../../providers/currency/currency';
@Component({
  selector: 'coin-icon',
  templateUrl: 'coin-icon.html'
})
export class CoinIconComponent {
  @Input()
  network: string;

  @Input()
  set coin(value: string) {
    this._coin = value;
    this.setCoinPath(this._coin);
  }

  get coin(): string {
    return this._coin;
  }

  private _coin: string;
  public assetUrl: string;

  private setCoinPath(coin: string) {
    this.assetUrl = 'assets/img/currencies/';
    if (this.network === 'testnet' && ['ltc'].includes(coin)) {
      this.assetUrl += 'testnet/';
    }

    this.assetUrl += `${coin}.svg`;
  }
  constructor(public currencyProvider: CurrencyProvider) {}
}
