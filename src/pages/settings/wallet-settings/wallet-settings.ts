import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavController, NavParams } from 'ionic-angular';
import { Logger } from '../../../providers/logger/logger';

// providers
import { ConfigProvider } from '../../../providers/config/config';
import { ExternalLinkProvider } from '../../../providers/external-link/external-link';
import { ProfileProvider } from '../../../providers/profile/profile';
import { TouchIdProvider } from '../../../providers/touchid/touchid';
import { WalletProvider } from '../../../providers/wallet/wallet';

// pages
import { BackupWarningPage } from '../../backup/backup-warning/backup-warning';
import { WalletColorPage } from './wallet-color/wallet-color';
import { WalletNamePage } from './wallet-name/wallet-name';
import { BitcoinCashPage } from './wallet-settings-advanced/bitcoin-cash/bitcoin-cash';
import { WalletAddressesPage } from './wallet-settings-advanced/wallet-addresses/wallet-addresses';
import { WalletDeletePage } from './wallet-settings-advanced/wallet-delete/wallet-delete';
import { WalletExportPage } from './wallet-settings-advanced/wallet-export/wallet-export';
import { WalletInformationPage } from './wallet-settings-advanced/wallet-information/wallet-information';
import { WalletServiceUrlPage } from './wallet-settings-advanced/wallet-service-url/wallet-service-url';
import { WalletSettingsAdvancedPage } from './wallet-settings-advanced/wallet-settings-advanced';
import { WalletTransactionHistoryPage } from './wallet-settings-advanced/wallet-transaction-history/wallet-transaction-history';

@Component({
  selector: 'page-wallet-settings',
  templateUrl: 'wallet-settings.html'
})
export class WalletSettingsPage {
  public wallet;
  public walletName;
  public canSign: boolean;
  public needsBackup: boolean;
  public hiddenBalance: boolean;
  public encryptEnabled: boolean;
  public touchIdEnabled: boolean;
  public touchIdPrevValue: boolean;
  public touchIdAvailable: boolean;
  public deleted: boolean = false;
  private config;

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
  ) {}

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

  public encryptChange(): void {
    if (!this.wallet) return;
    let val = this.encryptEnabled;

    if (val && !this.walletProvider.isEncrypted(this.wallet)) {
      this.logger.debug('Encrypting private key for', this.wallet.name);
      this.walletProvider
        .encrypt(this.wallet)
        .then(() => {
          this.profileProvider.updateCredentials(
            JSON.parse(this.wallet.export())
          );
          this.logger.debug('Wallet encrypted');
        })
        .catch(err => {
          this.logger.warn('Could not encrypt wallet', err);
          this.encryptEnabled = false;
        });
    } else if (!val && this.walletProvider.isEncrypted(this.wallet)) {
      this.walletProvider
        .decrypt(this.wallet)
        .then(() => {
          this.profileProvider.updateCredentials(
            JSON.parse(this.wallet.export())
          );
          this.logger.debug('Wallet decrypted');
        })
        .catch(err => {
          this.logger.warn('Could not decrypt wallet', err);
          this.encryptEnabled = true;
        });
    }
  }

  public openSupportSpendingPassword(): void {
    let url =
      'https://support.bitpay.com/hc/en-us/articles/360000244506-What-Does-a-Spending-Password-Do-';
    let optIn = true;
    let title = null;
    let message = this.translate.instant('Read more in our support page');
    let okText = this.translate.instant('Open');
    let cancelText = this.translate.instant('Go Back');
    this.externalLinkProvider.open(
      url,
      optIn,
      title,
      message,
      okText,
      cancelText
    );
  }

  public touchIdChange(): void {
    if (this.touchIdPrevValue == this.touchIdEnabled) return;
    let newStatus = this.touchIdEnabled;
    this.walletProvider
      .setTouchId(this.wallet, newStatus)
      .then(() => {
        this.touchIdPrevValue = this.touchIdEnabled;
        this.logger.debug('Touch Id status changed: ' + newStatus);
      })
      .catch(() => {
        this.touchIdEnabled = this.touchIdPrevValue;
      });
  }

  public openAdvancedSettings(): void {
    this.navCtrl.push(WalletSettingsAdvancedPage, {
      walletId: this.wallet.credentials.walletId
    });
  }

  public openWalletName(): void {
    this.navCtrl.push(WalletNamePage, {
      walletId: this.wallet.credentials.walletId
    });
  }

  public openWalletColor(): void {
    this.navCtrl.push(WalletColorPage, {
      walletId: this.wallet.credentials.walletId
    });
  }

  public openBackupSettings(): void {
    this.navCtrl.push(BackupWarningPage, {
      walletId: this.wallet.credentials.walletId
    });
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
  public openExportWallet(): void {
    this.navCtrl.push(WalletExportPage, {
      walletId: this.wallet.credentials.walletId
    });
  }
  public openWalletServiceUrl(): void {
    this.navCtrl.push(WalletServiceUrlPage, {
      walletId: this.wallet.credentials.walletId
    });
  }
  public openTransactionHistory(): void {
    this.navCtrl.push(WalletTransactionHistoryPage, {
      walletId: this.wallet.credentials.walletId
    });
  }
  public openDeleteWallet(): void {
    this.navCtrl.push(WalletDeletePage, {
      walletId: this.wallet.credentials.walletId
    });
  }
  public openBitcoinCashPage(): void {
    this.navCtrl.push(BitcoinCashPage, {
      walletId: this.wallet.credentials.walletId
    });
  }
}
