import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Logger } from '@nsalaun/ng-logger';

//providers
import { ProfileProvider } from '../../../../providers/profile/profile';

//pages
import { WalletInformationPage } from './wallet-information/wallet-information';
import { WalletAddressesPage } from './wallet-addresses/wallet-addresses';
import { WalletExportPage } from './wallet-export/wallet-export';
import { WalletServiceUrlPage } from './wallet-service-url/wallet-service-url';
import { WalletTransactionHistoryPage } from './wallet-transaction-history/wallet-transaction-history';
import { WalletDeletePage } from './wallet-delete/wallet-delete';

@Component({
  selector: 'page-wallet-settings-advanced',
  templateUrl: 'wallet-settings-advanced.html',
})
export class WalletSettingsAdvancedPage {
  public wallet: any;

  constructor(
    private profileProvider: ProfileProvider,
    private navCtrl: NavController,
    private navParams: NavParams,
    private logger: Logger
  ) {
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad WalletSettingsAdvancedPage');
  }

  ionViewWillEnter() {
    this.wallet = this.profileProvider.getWallet(this.navParams.data.walletId);
  }

  public openWalletInformation(): void {
    this.navCtrl.push(WalletInformationPage, { walletId: this.wallet.credentials.walletId });
  }
  public openWalletAddresses(): void {
    this.navCtrl.push(WalletAddressesPage, { walletId: this.wallet.credentials.walletId });
  }
  public openExportWallet(): void {
    this.navCtrl.push(WalletExportPage, { walletId: this.wallet.credentials.walletId });
  }
  public openWalletServiceUrl(): void {
    this.navCtrl.push(WalletServiceUrlPage, { walletId: this.wallet.credentials.walletId });
  }
  public openTransactionHistory(): void {
    this.navCtrl.push(WalletTransactionHistoryPage, { walletId: this.wallet.credentials.walletId });
  }
  public openDeleteWallet(): void {
    this.navCtrl.push(WalletDeletePage, { walletId: this.wallet.credentials.walletId });
  }
}