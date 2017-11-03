import { Component } from '@angular/core';
import { NavParams } from 'ionic-angular';
import { WalletProvider } from '../../providers/wallet/wallet';

@Component({
  selector: 'page-wallet-details',
  templateUrl: 'wallet-details.html'
})
export class WalletDetailsPage {
  public wallet: any;

  constructor(
    private navParams: NavParams,
    private walletProvider: WalletProvider,
  ) {
    this.wallet = this.navParams.data.wallet;
  }

  ionViewDidEnter() {
    if (!this.wallet.isComplete()) {
      console.log('Wallet incomplete');
      return;
    };
    
    console.log('Wallet:', this.wallet);
    this.getTxHistory();
  }

  getTxHistory(force?: boolean) {
    this.walletProvider.getTxHistory_(this.wallet, {force: force}).then((txh) => {
      this.wallet.completeHistory = txh;
    }).catch((err) => {
      console.log(err);
    });
  }
}