import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { WalletProvider } from '../../providers/wallet/wallet';
import { TxDetailsPage } from '../../pages/tx-details/tx-details';

@Component({
  selector: 'page-wallet-details',
  templateUrl: 'wallet-details.html'
})
export class WalletDetailsPage {
  public wallet: any;
  public alternativeBalanceStr: string;

  constructor(
    private navCtrl: NavController,
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
    this.getTxHistory();
  }
  
  goToTxDetails(tx: any) {
    this.navCtrl.push(TxDetailsPage, {wallet: this.wallet, tx: tx});
  }
  
  getTxHistory(force?: boolean) {
    let self = this;
    this.walletProvider.getTxHistory_(this.wallet, {force: force}).then((txh) => {
      self.wallet.completeHistory = txh;
    }).catch((err) => {
      console.log(err);
    });
  }
}