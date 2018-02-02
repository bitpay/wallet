import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Logger } from '../../../providers/logger/logger';
import { TranslateService } from '@ngx-translate/core';

//providers
import { ProfileProvider } from '../../../providers/profile/profile';
import { WalletProvider } from '../../../providers/wallet/wallet';
import { ExternalLinkProvider } from '../../../providers/external-link/external-link';
import { ConfigProvider } from '../../../providers/config/config';
import { TouchIdProvider } from '../../../providers/touchid/touchid';

//pages
import { WalletSettingsAdvancedPage } from './wallet-settings-advanced/wallet-settings-advanced';
import { WalletColorPage } from './wallet-color/wallet-color';
import { WalletNamePage } from './wallet-name/wallet-name';
import { BackupWarningPage } from '../../backup/backup-warning/backup-warning';

@Component({
  selector: 'page-wallet-settings',
  templateUrl: 'wallet-settings.html',
})
export class WalletSettingsPage {

  public wallet: any;
  public walletName: any;
  public canSign: boolean;
  public needsBackup: boolean;
  public hiddenBalance: boolean;
  public encryptEnabled: boolean;
  public touchIdEnabled: boolean;
  public touchIdPrevValue: boolean;
  public touchIdAvailable: boolean;
  public deleted: boolean = false;
  private config: any;

  constructor(
    private profileProvider: ProfileProvider,
    private logger: Logger,
    private walletProvider: WalletProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private configProvider: ConfigProvider,
    private navCtrl: NavController,
    private navParams: NavParams,
    private touchIdProvider: TouchIdProvider,
    private translate: TranslateService
  ) {
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad WalletSettingsPage');
  }

  ionViewWillEnter() {
    this.wallet = this.profileProvider.getWallet(this.navParams.data.walletId);
    this.walletName = this.wallet.name;
    this.canSign = this.wallet.canSign();
    this.needsBackup = this.wallet.needsBackup;
    this.hiddenBalance = this.wallet.balanceHidden;
    this.encryptEnabled = this.walletProvider.isEncrypted(this.wallet);
    this.touchIdProvider.isAvailable().then((isAvailable: boolean) => {
      this.touchIdAvailable = isAvailable;
    });
    this.config = this.configProvider.get();
    this.touchIdEnabled = this.config.touchIdFor ? this.config.touchIdFor[this.wallet.credentials.walletId] : null;
    this.touchIdPrevValue = this.touchIdEnabled;
    if (this.wallet.credentials && !this.wallet.credentials.mnemonicEncrypted && !this.wallet.credentials.mnemonic)
      this.deleted = true;
  }

  public hiddenBalanceChange(): void {
    this.profileProvider.toggleHideBalanceFlag(this.wallet.credentials.walletId);
  }

  public encryptChange(): void {
    if (!this.wallet) return;
    let val = this.encryptEnabled;

    if (val && !this.walletProvider.isEncrypted(this.wallet)) {
      this.logger.debug('Encrypting private key for', this.wallet.name);
      this.walletProvider.encrypt(this.wallet).then(() => {
        this.profileProvider.updateCredentials(JSON.parse(this.wallet.export()));
        this.logger.debug('Wallet encrypted');
      }).catch((err: any) => {
        this.logger.warn(err);
        this.encryptEnabled = false;
      })
    } else if (!val && this.walletProvider.isEncrypted(this.wallet)) {
      this.walletProvider.decrypt(this.wallet).then(() => {
        this.profileProvider.updateCredentials(JSON.parse(this.wallet.export()));
        this.logger.debug('Wallet decrypted');
      }).catch((err) => {
        this.logger.warn(err);
        this.encryptEnabled = true;
      });
    }
  }

  public openWikiSpendingPassword(): void {
    let url = 'https://github.com/bitpay/copay/wiki/COPAY---FAQ#what-the-spending-password-does';
    let optIn = true;
    let title = null;
    let message = this.translate.instant('Read more in our Wiki'); //TODO gettextcatalog
    let okText = this.translate.instant('Open');//TODO gettextcatalog
    let cancelText = this.translate.instant('Go Back');//TODO gettextcatalog
    this.externalLinkProvider.open(url, optIn, title, message, okText, cancelText);
  }

  public touchIdChange(): void {
    if (this.touchIdPrevValue == this.touchIdEnabled) return;
    let newStatus = this.touchIdEnabled;
    this.walletProvider.setTouchId(this.wallet, newStatus).then(() => {
      this.touchIdPrevValue = this.touchIdEnabled;
      this.logger.debug('Touch Id status changed: ' + newStatus);
    }).catch((err: any) => {
      this.touchIdEnabled = this.touchIdPrevValue;
    });
  }

  public openAdvancedSettings(): void {
    this.navCtrl.push(WalletSettingsAdvancedPage, { walletId: this.wallet.credentials.walletId });
  }

  public openWalletName(): void {
    this.navCtrl.push(WalletNamePage, { walletId: this.wallet.credentials.walletId });
  }

  public openWalletColor(): void {
    this.navCtrl.push(WalletColorPage, { walletId: this.wallet.credentials.walletId });
  }

  public openBackupSettings(): void {
    this.navCtrl.push(BackupWarningPage, { walletId: this.wallet.credentials.walletId });
  }

}