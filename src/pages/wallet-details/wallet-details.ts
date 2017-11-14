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
  private HISTORY_SHOW_LIMIT: number;
  private HISTORY_PAGE_COUNTER: number;

  public wallet: any;
  public history: any;

  constructor(
    private navCtrl: NavController,
    private navParams: NavParams,
    private profileProvider: ProfileProvider,
    private walletProvider: WalletProvider,
  ) {
    this.wallet = this.profileProvider.getWallet(this.navParams.data.walletId);
    this.history = [];
    this.HISTORY_SHOW_LIMIT = 10;
    this.HISTORY_PAGE_COUNTER = 2;
  }
  
  ionViewDidEnter() {
    if (!this.wallet.isComplete()) {
      console.log('Wallet incomplete');
      return;
    };
    this.getTxHistory();
  }
  
  getTxHistory(force?: boolean) {
    if (force) {
      this.history = [];
      this.HISTORY_PAGE_COUNTER = 2;
    }

    this.walletProvider.getTxHistory(this.wallet, { force: force }).then((txh) => {
      this.wallet.completeHistory = txh;
      this.wallet.completeHistory.isValid = true;
      this.history = this.wallet.completeHistory.slice(0, this.HISTORY_SHOW_LIMIT);
    }).catch((err) => {
      console.log(err);
    });
  }

  loadHistory(loading) {
    if (this.history.length === this.wallet.completeHistory.length) {
      loading.complete();
      return;
    }
    let self = this;
    setTimeout(function() {
      self.history = self.wallet.completeHistory.slice(0, self.HISTORY_PAGE_COUNTER * self.HISTORY_SHOW_LIMIT);
      self.HISTORY_PAGE_COUNTER++;
      loading.complete();
    }, 300);
  }

  goToTxDetails(tx: any) {
    this.navCtrl.push(TxDetailsPage, { walletId: this.wallet.credentials.walletId, txid: tx.txid });
  }
}