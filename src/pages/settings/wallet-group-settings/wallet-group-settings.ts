import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavController, NavParams } from 'ionic-angular';

// providers
import { ActionSheetProvider } from '../../../providers/action-sheet/action-sheet';
import { ConfigProvider } from '../../../providers/config/config';
import { ExternalLinkProvider } from '../../../providers/external-link/external-link';
import { Logger } from '../../../providers/logger/logger';
import { ProfileProvider } from '../../../providers/profile/profile';
import { TouchIdProvider } from '../../../providers/touchid/touchid';
import { WalletProvider } from '../../../providers/wallet/wallet';

// pages
import { BackupKeyPage } from '../../backup/backup-key/backup-key';
import { WalletExportPage } from './wallet-export/wallet-export';
import { WalletExtendedPrivateKeyPage } from './wallet-extended-private-key/wallet-extended-private-key';
import { WalletGroupDeletePage } from './wallet-group-delete/wallet-group-delete';
import { WalletNamePage } from './wallet-name/wallet-name';
import { WalletServiceUrlPage } from './wallet-service-url/wallet-service-url';

@Component({
  selector: 'page-wallet-group-settings',
  templateUrl: 'wallet-group-settings.html'
})
export class WalletGroupSettingsPage {
  public needsBackup: boolean;
  public encryptEnabled: boolean;
  public touchIdEnabled: boolean;
  public touchIdPrevValue: boolean;
  public touchIdAvailable: boolean;
  public deleted: boolean = false;
  public noFromWalletGroup: boolean;
  public walletGroup;
  public wallets;
  public canSign: boolean;

  private config;

  constructor(
    private profileProvider: ProfileProvider,
    private logger: Logger,
    private walletProvider: WalletProvider,
    private configProvider: ConfigProvider,
    private actionSheetProvider: ActionSheetProvider,
    private navCtrl: NavController,
    private navParams: NavParams,
    private touchIdProvider: TouchIdProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private translate: TranslateService
  ) {}

  async ionViewDidLoad() {
    this.logger.info('Loaded:  WalletGroupSettingsPage');
    this.config = this.configProvider.get();

    this.walletGroup = await this.profileProvider.getWalletGroup(
      this.navParams.data.walletGroupId
    );
    this.needsBackup = this.walletGroup.needsBackup;

    this.wallets = await this.profileProvider.getGroupWallets(
      this.navParams.data.walletGroupId
    );
    this.canSign = this.wallets[0].canSign();
    this.encryptEnabled = this.walletProvider.isEncrypted(this.wallets[0]);
    this.touchIdEnabled = this.config.touchIdFor
      ? this.config.touchIdFor[this.wallets[0].credentials.walletId]
      : null;
    this.touchIdPrevValue = this.touchIdEnabled;
    this.touchIdProvider.isAvailable().then((isAvailable: boolean) => {
      this.touchIdAvailable = isAvailable;
    });
  }

  public touchIdChange(): void {
    if (this.touchIdPrevValue == this.touchIdEnabled) return;
    const newStatus = this.touchIdEnabled;
    this.walletProvider
      .setTouchId(this.wallets, newStatus)
      .then(() => {
        this.touchIdPrevValue = this.touchIdEnabled;
        this.logger.debug('Touch Id status changed: ' + newStatus);
      })
      .catch(err => {
        this.logger.error('Error with fingerprint:', err);
        this.touchIdEnabled = this.touchIdPrevValue;
      });
  }

  public encryptChange(): void {
    const val = this.encryptEnabled;

    if (val && !this.walletProvider.isEncrypted(this.wallets[0])) {
      this.logger.debug(
        'Encrypting private key for group: ',
        this.walletGroup.name
      );
      this.walletProvider
        .encrypt(this.wallets)
        .then(() => {
          this.wallets.forEach(wallet => {
            this.profileProvider.updateCredentials(JSON.parse(wallet.export()));
          });
          this.logger.debug('Group wallets encrypted');
        })
        .catch(err => {
          this.encryptEnabled = false;
          const title = this.translate.instant('Could not encrypt wallet');
          this.showErrorInfoSheet(err, title);
        });
    } else if (!val && this.walletProvider.isEncrypted(this.wallets[0])) {
      this.walletProvider
        .decrypt(this.wallets)
        .then(() => {
          this.wallets.forEach(wallet => {
            this.profileProvider.updateCredentials(JSON.parse(wallet.export()));
          });
          this.logger.debug('Group wallets decrypted');
        })
        .catch(err => {
          this.encryptEnabled = true;
          const title = 'Could not decrypt group wallets';
          this.showErrorInfoSheet(err, title);
        });
    }
  }

  private showErrorInfoSheet(
    err: Error | string,
    infoSheetTitle: string
  ): void {
    if (!err) return;
    this.logger.warn('Could not encrypt/decrypt group wallets:', err);
    const errorInfoSheet = this.actionSheetProvider.createInfoSheet(
      'default-error',
      { msg: err, title: infoSheetTitle }
    );
    errorInfoSheet.present();
  }

  public openBackupSettings(): void {
    this.navCtrl.push(BackupKeyPage, {
      walletGroupId: this.navParams.data.walletGroupId
    });
  }

  public openWalletName(): void {
    this.navCtrl.push(WalletNamePage, {
      walletGroupId: this.navParams.data.walletGroupId
    });
  }

  public openDeleteWalletGroup(): void {
    this.navCtrl.push(WalletGroupDeletePage, {
      walletGroupId: this.navParams.data.walletGroupId
    });
  }

  public openWalletExtendedPrivateKey(): void {
    this.navCtrl.push(WalletExtendedPrivateKeyPage, {
      walletGroupId: this.navParams.data.walletGroupId
    });
  }

  public openExportWallet(): void {
    this.navCtrl.push(WalletExportPage, {
      walletGroupId: this.navParams.data.walletGroupId
    });
  }

  public openWalletServiceUrl(): void {
    this.navCtrl.push(WalletServiceUrlPage, {
      walletGroupId: this.navParams.data.walletGroupId
    });
  }

  public openSupportEncryptPassword(): void {
    const url =
      'https://support.bitpay.com/hc/en-us/articles/360000244506-What-Does-a-Spending-Password-Do-';
    const optIn = true;
    const title = null;
    const message = this.translate.instant('Read more in our support page');
    const okText = this.translate.instant('Open');
    const cancelText = this.translate.instant('Go Back');
    this.externalLinkProvider.open(
      url,
      optIn,
      title,
      message,
      okText,
      cancelText
    );
  }
}
