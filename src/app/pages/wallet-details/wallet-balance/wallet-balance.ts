import { Component, ViewEncapsulation } from '@angular/core';
import { ModalController, NavParams } from '@ionic/angular';
import { CurrencyProvider } from '../../../providers/currency/currency';
import { Logger } from '../../../providers/logger/logger';

@Component({
  selector: 'page-wallet-balance',
  templateUrl: 'wallet-balance.html',
  styleUrls: ['/wallet-balance.scss'],
  encapsulation: ViewEncapsulation.None
})
export class WalletBalanceModal {
  public status;
  public coinName: string;

  constructor(
    private currencyProvider: CurrencyProvider,
    private logger: Logger,
    private navParams: NavParams,
    private viewCtrl: ModalController
  ) {
    this.status = this.navParams.data.status;
    this.coinName = this.currencyProvider.getCoinName(this.status.wallet.coin);
  }

  ngOnInit(){
    this.logger.info('Loaded:  WalletBalanceModal');
  }

  close() {
    this.viewCtrl.dismiss();
  }
}
