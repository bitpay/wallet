import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Logger } from '../../../providers/logger/logger';

// pages

import { CreateWalletPage } from '../create-wallet/create-wallet';

@Component({
  selector: 'page-select-currency',
  templateUrl: 'select-currency.html'
})
export class SelectCurrencyPage {
  public coin: string;
  private isShared: boolean;
  private addingNewAccount: boolean;

  constructor(
    private navCtrl: NavController,
    private logger: Logger,
    private navParam: NavParams
  ) {
    this.isShared = this.navParam.data.isShared;
    this.addingNewAccount = this.navParam.data.addingNewAccount;
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: SelectCurrencyPage');
  }

  public goToCreateWallet(coin): void {
    this.navCtrl.push(CreateWalletPage, {
      isShared: this.isShared,
      coin,
      addingNewAccount: this.addingNewAccount
    });
  }
}
