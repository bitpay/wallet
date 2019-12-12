import { Component } from '@angular/core';
import { NavParams } from 'ionic-angular';
import { CurrencyProvider } from '../../../providers/currency/currency';
import { Logger } from '../../../providers/logger/logger';

@Component({
  selector: 'page-wallet-balance',
  templateUrl: 'wallet-balance.html'
})
export class WalletBalancePage {
  public status;
  public coinName: string;

  constructor(
    private currencyProvider: CurrencyProvider,
    private logger: Logger,
    private navParams: NavParams
  ) {
    this.status = this.navParams.data.status;
    this.coinName = this.currencyProvider.getCoinName(this.status.wallet.coin);
  }

  ionViewDidLoad() {
    this.logger.info('Loaded:  WalletBalancePage');
  }
}
