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
  public walletNotRegistered: boolean;
  public updateError: boolean;

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
    this.walletNotRegistered = null;
    this.updateError = null;
  }
  
  ionViewDidEnter() {
    if (!this.wallet.isComplete()) {
      console.log('Wallet incomplete');
      return;
    };
    this.updateStatus();
  }
  
  toggleBalance() {
    this.profileProvider.toggleHideBalanceFlag(this.wallet.credentials.walletId);
  }

  loadHistory(loading) {
    if (this.history.length === this.wallet.completeHistory.length) {
      loading.complete();
      return;
    }
    setTimeout(() => {
      this.history = this.wallet.completeHistory.slice(0, this.HISTORY_PAGE_COUNTER * this.HISTORY_SHOW_LIMIT);
      this.HISTORY_PAGE_COUNTER++;
      loading.complete();
    }, 300);
  }

  updateStatus(force?: boolean) {
    if (force) {
      this.history = [];
      this.HISTORY_PAGE_COUNTER = 2;
    }
    
    this.wallet.updating = true;
    this.walletProvider.getStatus(this.wallet, { force: !!force }).then((status) => {
      this.wallet.status = status;
      
      this.walletProvider.getTxHistory(this.wallet, { force: !!force }).then((txh) => {
        this.wallet.updating = false;
        
        this.wallet.error = null;
        this.wallet.completeHistory = txh;
        this.wallet.completeHistory.isValid = true;
        this.history = this.wallet.completeHistory.slice(0, this.HISTORY_SHOW_LIMIT);
      }).catch((err) => {
        this.wallet.updating = false;
        this.updateError = true;
        this.wallet.error = err;
      });
    }).catch((err) => {
      this.wallet.updating = false;
      this.wallet.error = err;

      if (err === 'WALLET_NOT_REGISTERED')
        this.walletNotRegistered = true;
      else
        this.updateError = true;
    });
  };

  recreate(wallet: any) {
    this.walletProvider.recreate(wallet).then(() => {
      this.updateStatus(true);
    });
  };

  goToTxDetails(tx: any) {
    this.navCtrl.push(TxDetailsPage, { walletId: this.wallet.credentials.walletId, txid: tx.txid });
  }
}