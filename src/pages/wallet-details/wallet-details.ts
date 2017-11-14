import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { WalletProvider } from '../../providers/wallet/wallet';
import { ProfileProvider } from '../../providers/profile/profile';
import { TxDetailsPage } from '../../pages/tx-details/tx-details';

@Component({
  selector: 'page-wallet-details',
  templateUrl: 'wallet-details.html'
})
export class WalletDetailsPage {
  public wallet: any;

  constructor(
    private navCtrl: NavController,
    private navParams: NavParams,
    private profileProvider: ProfileProvider,
    private walletProvider: WalletProvider,
  ) {
    this.wallet = this.profileProvider.getWallet(this.navParams.data.walletId);
  }
  
  ionViewDidEnter() {
    if (!this.wallet.isComplete()) {
      console.log('Wallet incomplete');
      return;
    };
    this.getTxHistory();
  }
  
  getTxHistory(force?: boolean) {
    if (force) this.wallet.completeHistory = [];
    
    this.walletProvider.getTxHistory(this.wallet, {force: force}).then((txh) => {
      this.wallet.completeHistory = txh;
    }).catch((err) => {
      console.log(err);
    });
  }
  
  goToTxDetails(tx: any) {
    this.navCtrl.push(TxDetailsPage, {walletId: this.wallet.credentials.walletId, txid: tx.txid});
  }
}