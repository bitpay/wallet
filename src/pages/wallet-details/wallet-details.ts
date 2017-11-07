import { Component } from '@angular/core';
import { NavParams } from 'ionic-angular';
import { WalletProvider } from '../../providers/wallet/wallet';

@Component({
  selector: 'page-wallet-details',
  templateUrl: 'wallet-details.html'
})
export class WalletDetailsPage {
  public wallet: any;
  public alternativeBalanceStr: string;

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
    this.alternativeBalanceStr = this.wallet.status.totalBalanceAlternative + ' ' + this.wallet.status.alternativeIsoCode;
    this.getTxHistory();
  }

  goToTxDetails(txid: string) {
    return;
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