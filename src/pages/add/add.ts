import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Logger } from '../../providers/logger/logger';

// pages
import { JoinWalletPage } from './join-wallet/join-wallet';
import { SelectCurrencyPage } from './select-currency/select-currency';

@Component({
  selector: 'page-add',
  templateUrl: 'add.html'
})
export class AddPage {
  private addingNewAccount: boolean;

  constructor(
    private navCtrl: NavController,
    private logger: Logger,
    private navParam: NavParams
  ) {
    this.addingNewAccount = this.navParam.data.addingNewAccount;
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: AddPage');
  }

  public goToSelectCurrencyPage(isShared: boolean): void {
    this.navCtrl.push(SelectCurrencyPage, {
      isShared,
      addingNewAccount: this.addingNewAccount
    });
  }

  public goToJoinWallet(): void {
    this.navCtrl.push(JoinWalletPage);
  }
}
