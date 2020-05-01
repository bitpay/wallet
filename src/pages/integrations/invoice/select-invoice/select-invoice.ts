import { Component } from '@angular/core';
import { NavParams } from 'ionic-angular';
import { Logger } from '../../../../providers/logger/logger';

// Provider
import { CurrencyProvider, IncomingDataProvider } from '../../../../providers';
import { CoinsMap } from '../../../../providers/currency/currency';

@Component({
  selector: 'select-invoice-page',
  templateUrl: 'select-invoice.html'
})
export class SelectInvoicePage {
  public paymentOptions: any;
  public hasWallets: CoinsMap<number>;
  private payProUrl: string;

  constructor(
    private currencyProvider: CurrencyProvider,
    private incomingDataProvider: IncomingDataProvider,
    private logger: Logger,
    private navParams: NavParams
  ) {
    this.paymentOptions = this.navParams.data.payProOptions.paymentOptions
      .reverse()
      .sort(a => (a.disabled ? 1 : -1));
    this.payProUrl = this.navParams.data.payProOptions.payProUrl;
    this.hasWallets = this.navParams.data.hasWallets;
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: SelectInvoicePage');
  }

  public getCoinName(currency): string {
    const coin = currency.toLowerCase();
    return this.currencyProvider.getCoinName(coin);
  }

  public goToPayPro(currency): void {
    const coin = currency.toLowerCase();
    if (this.navParams.data.walletCardRedir) {
      this.payProUrl += '?redir=wc';
    }
    this.incomingDataProvider.goToPayPro(
      this.payProUrl,
      coin,
      this.navParams.data.payProOptions
    );
  }
}
