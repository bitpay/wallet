import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Logger } from '../../../providers/logger/logger';

// providers
import { ConfigProvider } from '../../../providers/config/config';
import { ProfileProvider } from '../../../providers/profile/profile';
import { TouchIdProvider } from '../../../providers/touchid/touchid';
import { WalletProvider } from '../../../providers/wallet/wallet';

// pages
import { WalletAddressesPage } from './wallet-settings-advanced/wallet-addresses/wallet-addresses';
import { WalletInformationPage } from './wallet-settings-advanced/wallet-information/wallet-information';
import { WalletTransactionHistoryPage } from './wallet-settings-advanced/wallet-transaction-history/wallet-transaction-history';

@Component({
  selector: 'page-wallet-settings',
  templateUrl: 'wallet-settings.html'
})
export class WalletSettingsPage {
  public wallet;
  public canSign: boolean;
  public needsBackup: boolean;
  public hiddenBalance: boolean;
  public encryptEnabled: boolean;
  public touchIdEnabled: boolean;
  public touchIdPrevValue: boolean;
  public touchIdAvailable: boolean;
  public deleted: boolean = false;
  private config;
  public noFromWalletGroup: boolean;

  constructor(
    private profileProvider: ProfileProvider,
    private logger: Logger,
    private walletProvider: WalletProvider,
    private configProvider: ConfigProvider,
    private navCtrl: NavController,
    private navParams: NavParams,
    private touchIdProvider: TouchIdProvider
  ) { }

  ionViewDidLoad() {
    this.logger.info('Loaded:  WalletSettingsPage');
    this.wallet = this.profileProvider.getWallet(this.navParams.data.walletId);
    this.canSign = this.wallet.canSign();
    this.needsBackup = this.wallet.needsBackup;
    this.hiddenBalance = this.wallet.balanceHidden;
    this.encryptEnabled = this.walletProvider.isEncrypted(this.wallet);
    this.touchIdProvider.isAvailable().then((isAvailable: boolean) => {
      this.touchIdAvailable = isAvailable;
    });
    this.config = this.configProvider.get();
    this.touchIdEnabled = this.config.touchIdFor
      ? this.config.touchIdFor[this.wallet.credentials.walletId]
      : null;
    this.touchIdPrevValue = this.touchIdEnabled;
    if (
      this.wallet.credentials &&
      !this.wallet.credentials.mnemonicEncrypted &&
      !this.wallet.credentials.mnemonic
    ) {
      this.deleted = true;
    }
  }

  public hiddenBalanceChange(): void {
    this.profileProvider.toggleHideBalanceFlag(
      this.wallet.credentials.walletId
    );
  }

  public openWalletInformation(): void {
    this.navCtrl.push(WalletInformationPage, {
      walletId: this.wallet.credentials.walletId
    });
  }

  public openWalletAddresses(): void {
    this.navCtrl.push(WalletAddressesPage, {
      walletId: this.wallet.credentials.walletId
    });
  }

  public openTransactionHistory(): void {
    this.navCtrl.push(WalletTransactionHistoryPage, {
      walletId: this.wallet.credentials.walletId
    });
  }
}
