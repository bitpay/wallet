import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { AddPage } from "../add/add";
import { ProfileProvider } from '../../providers/profile/profile';
import { ReleaseProvider } from '../../providers/release/release';
import { WalletProvider } from '../../providers/wallet/wallet';
import { BwcErrorProvider } from '../../providers/bwc-error/bwc-error';
import * as _ from 'lodash';
import * as moment from 'moment';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  public wallets: any;

  constructor(
    private navCtrl: NavController,
    private profileProvider: ProfileProvider,
    private releaseProvider: ReleaseProvider,
    private walletProvider: WalletProvider,
    private bwcErrorProvider: BwcErrorProvider
  ) {
    this.checkUpdate();
    this.wallets = this.profileProvider.getWallets();
    this.updateAllWallets();
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad HomePage');
  }

  private updateAllWallets(): void {
    _.each(this.wallets, (wallet: any) => {
      this.walletProvider.getStatus(wallet, {}).then((status: any) => {
        const balanceStr = status.totalBalanceStr ? wallet.status.totalBalanceStr : '';
        const cachedBalanceStr = wallet.cachedBalance ? wallet.cachedBalance : '';
        const cachedBalanceUpdateOn = wallet.cachedBalanceUpdatedOn ? ' - ' + moment(wallet.cachedBalanceUpdatedOn * 1000).fromNow() : '';
        wallet.statusStr = balanceStr || cachedBalanceStr + cachedBalanceUpdateOn;
        wallet.status = status;
        this.profileProvider.setLastKnownBalance(wallet.id, wallet.status.totalBalanceStr);
      }).catch((err) => {
        wallet.error = (err === 'WALLET_NOT_REGISTERED') ? 'Wallet not registered' : this.bwcErrorProvider.msg(err);
        console.log(err);
      });
    });
  }

  private checkUpdate(): void {
    this.releaseProvider.getLatestAppVersion()
      .then((version) => {
        console.log('Current app version:', version);
        var result = this.releaseProvider.checkForUpdates(version);
        console.log('Update available:', result.updateAvailable);
      })
      .catch((err) => {
        console.log('Error:', err);
      })
  }

  public goToAddView(): void {
    this.navCtrl.push(AddPage);
  }
}
