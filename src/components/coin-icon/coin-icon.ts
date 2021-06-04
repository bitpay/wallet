import { Component, Input } from '@angular/core';
import { CurrencyProvider } from '../../providers/currency/currency';
@Component({
  selector: 'coin-icon',
  templateUrl: 'coin-icon.html'
})
export class CoinIconComponent {
  public Coin = {
    BTC: 'btc',
    BCH: 'bch',
    ETH: 'eth',
    XRP: 'xrp',
    USDC: 'usdc',
    GUSD: 'gusd',
    PAX: 'pax',
    BUSD: 'busd',
    DAI: 'dai',
    WBTC: 'wbtc',
    DOGE: 'doge'
  };

  @Input()
  coin: string;
  @Input()
  network: string;

  constructor(public currencyProvider: CurrencyProvider) {}
}
