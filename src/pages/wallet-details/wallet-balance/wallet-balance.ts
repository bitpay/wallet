import { Component } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';
import { CurrencyProvider } from '../../../providers/currency/currency';
import { Logger } from '../../../providers/logger/logger';

@Component({
  selector: 'page-wallet-balance',
  templateUrl: 'wallet-balance.html'
})
export class WalletBalanceModal {
  public status;
  public coinName: string;

  constructor(
    private currencyProvider: CurrencyProvider,
    private logger: Logger,
    private navParams: NavParams,
    private viewCtrl: ViewController
  ) {
    this.status = this.navParams.data.status;
    this.coinName = this.currencyProvider.getCoinName(this.status.wallet.coin);
  }

  ionViewDidLoad() {
    this.logger.info('Loaded:  WalletBalanceModal');
  }

  close() {
    this.viewCtrl.dismiss();
  }
}
