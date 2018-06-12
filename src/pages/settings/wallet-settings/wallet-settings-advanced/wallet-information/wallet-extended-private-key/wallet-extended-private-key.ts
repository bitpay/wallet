import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Logger } from '../../../../../../providers/logger/logger';

// providers
import { ProfileProvider } from '../../../../../../providers/profile/profile';
import { WalletProvider } from '../../../../../../providers/wallet/wallet';

@Component({
  selector: 'page-wallet-extended-private-key',
  templateUrl: 'wallet-extended-private-key.html'
})
export class WalletExtendedPrivateKeyPage {
  public wallet;
  public credentialsEncrypted: boolean;
  public xPrivKey: string;

  constructor(
    private profileProvider: ProfileProvider,
    private walletProvider: WalletProvider,
    private logger: Logger,
    private navParams: NavParams,
    private navCtrl: NavController
  ) {}

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad WalletExtendedPrivateKeyPage');
  }

  ionViewWillEnter() {
    this.wallet = this.profileProvider.getWallet(this.navParams.data.walletId);
    this.credentialsEncrypted = this.wallet.isPrivKeyEncrypted();
  }

  ionViewDidEnter() {
    this.walletProvider
      .getKeys(this.wallet)
      .then(k => {
        this.xPrivKey = k.xPrivKey;
        this.credentialsEncrypted = false;
      })
      .catch(err => {
        this.logger.error('Could not get keys: ', err);
        this.navCtrl.pop();
      });
  }
}
