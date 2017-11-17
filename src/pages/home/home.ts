import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { AddPage } from "../add/add";
import { ProfileProvider } from '../../providers/profile/profile';
import { ReleaseProvider } from '../../providers/release/release';
import { WalletProvider } from '../../providers/wallet/wallet';
import { BwcErrorProvider } from '../../providers/bwc-error/bwc-error';
import { WalletDetailsPage } from '../wallet-details/wallet-details';
import { Logger } from '@nsalaun/ng-logger';
import * as _ from 'lodash';
import * as moment from 'moment';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  public wallets: any;
  public walletsBtc: any;
  public walletsBch: any;
  public cachedBalanceUpdateOn: string;

  constructor(
    private navCtrl: NavController,
    private profileProvider: ProfileProvider,
    private releaseProvider: ReleaseProvider,
    private walletProvider: WalletProvider,
    private bwcErrorProvider: BwcErrorProvider,
    private logger: Logger
  ) { 
    this.cachedBalanceUpdateOn = '';
  }

  ionViewDidEnter() {
    this.wallets = this.profileProvider.getWallets();
    this.checkUpdate();
    this.updateAllWallets();
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad HomePage');
  }

  private updateAllWallets(): void {
    let wallets: Array<any> = [];
    this.walletsBtc = this.profileProvider.getWallets({ coin: 'btc' });
    this.walletsBch = this.profileProvider.getWallets({ coin: 'bch' });

    _.each(this.walletsBtc, function (wBtc) {
      wallets.push(wBtc);
    });

    _.each(this.walletsBch, function (wBch) {
      wallets.push(wBch);
    });

    if (_.isEmpty(wallets)) return;

    _.each(wallets, (wallet: any) => {
      this.walletProvider.getStatus(wallet, {}).then((status: any) => {
        this.cachedBalanceUpdateOn = wallet.cachedBalanceUpdatedOn ? ' - ' + moment(wallet.cachedBalanceUpdatedOn * 1000).fromNow() : '';
        this.profileProvider.setLastKnownBalance(wallet.id, status.availableBalanceSat);
        wallet.status = status;
      }).catch((err) => {
        wallet.error = (err === 'WALLET_NOT_REGISTERED') ? 'Wallet not registered' : this.bwcErrorProvider.msg(err);
        this.logger.warn(err);
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

  public goToAddView(coin?: string): void {
    this.navCtrl.push(AddPage, { coin: coin });
  }

  goToWalletDetails(wallet: any) {
    this.navCtrl.push(WalletDetailsPage, { walletId: wallet.credentials.walletId });
  }
}
