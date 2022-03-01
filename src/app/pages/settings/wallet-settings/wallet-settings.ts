import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Logger } from '../../../providers/logger/logger';
import { Router } from '@angular/router';

// services
import { ConfigProvider } from '../../../providers/config/config';
import { ExternalLinkProvider } from '../../../providers/external-link/external-link';
import { KeyProvider } from '../../../providers/key/key';
import { ProfileProvider } from '../../../providers/profile/profile';
import { PushNotificationsProvider } from '../../../providers/push-notifications/push-notifications';
import { TouchIdProvider } from '../../../providers/touchid/touchid';
import { WalletProvider } from '../../../providers/wallet/wallet';

@Component({
  selector: 'page-wallet-settings',
  templateUrl: 'wallet-settings.html',
  styleUrls: ['wallet-settings.scss']
})
export class WalletSettingsPage {
  public showDuplicateWallet: boolean;
  public wallet;
  public canSign: boolean;
  public needsBackup: boolean;
  public encryptEnabled: boolean;
  public touchIdEnabled: boolean;
  public touchIdPrevValue: boolean;
  public touchIdAvailable: boolean;
  public deleted: boolean = false;
  private config;
  navParamsData;

  constructor(
    private profileProvider: ProfileProvider,
    private logger: Logger,
    private walletProvider: WalletProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private configProvider: ConfigProvider,
    private router: Router,
    private touchIdProvider: TouchIdProvider,
    private translate: TranslateService,
    private keyProvider: KeyProvider,
    private pushNotificationsProvider: PushNotificationsProvider
  ) {
    if (this.router.getCurrentNavigation()) {
       this.navParamsData = this.router.getCurrentNavigation().extras.state ? this.router.getCurrentNavigation().extras.state : {};
    } else {
      this.navParamsData =  history ? history.state : undefined;
    }
    this.logger.info('Loaded:  WalletSettingsPage');
    this.wallet = this.profileProvider.getWallet(this.navParamsData.walletId);
  }

  ionViewWillEnter() {
    this.canSign = this.wallet.canSign;
    this.needsBackup = this.wallet.needsBackup;
    this.encryptEnabled = this.wallet.isPrivKeyEncrypted;

    this.checkBiometricIdAvailable();

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
    this.showDuplicateWallet = this.getShowDuplicateWalletOption();
  }

  private getShowDuplicateWalletOption(): boolean {
    if (this.wallet.network != 'livenet' || this.wallet.coin != 'btc')
      return false;

    const key = this.keyProvider.getKey(this.wallet.credentials.keyId);
    if (!key) return false;

    // only available for OLD multisig wallets. or single sig
    if (this.wallet.n > 1 && !key.use44forMultisig) return false;

    // only first account
    if (this.wallet.credentials.account != 0) return false;

    return true;
  }

  private checkBiometricIdAvailable() {
    this.touchIdProvider.isAvailable().then((isAvailable: boolean) => {
      this.touchIdAvailable = isAvailable;
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

  public touchIdChange(): void {
    if (this.touchIdPrevValue == this.touchIdEnabled) return;
    const newStatus = this.touchIdEnabled;
    this.walletProvider
      .setTouchId([].concat(this.wallet), newStatus)
      .then(() => {
        this.touchIdPrevValue = this.touchIdEnabled;
        this.logger.debug('Touch Id status changed: ' + newStatus);
      })
      .catch(err => {
        this.logger.error('Error with fingerprint:', err);
        this.checkBiometricIdAvailable();
        this.touchIdEnabled = this.touchIdPrevValue;
      });
  }

  public openWalletName(): void {
    this.router.navigate(['/wallet-name'], {
      state: {
        walletId: this.wallet.credentials.walletId
      }
    });
  }

  public openWalletInformation(): void {
    this.router.navigate(['/wallet-information'], {
      state: {
        walletId: this.wallet.credentials.walletId
      }
    });
  }
  public openWalletAddresses(): void {
    this.router.navigate(['/wallet-addresses'], {
      state: {
        walletId: this.wallet.credentials.walletId
      }
    });
    
  }
  public openExportWallet(): void {
    this.router.navigate(['/wallet-export'], {
      state: {
        walletId: this.wallet.credentials.walletId
      }
    });
  }
  public openWalletServiceUrl(): void {
    this.router.navigate(['/wallet-service-url'], {
      state: {
        walletId: this.wallet.credentials.walletId
      }
    });
  }
  public openTransactionHistory(): void {
    this.router.navigate(['/wallet-transaction-history'], {
      state: {
        walletId: this.wallet.credentials.walletId
      }
    });
  }
  public openDuplicateWallet(): void {
    this.router.navigate(['/wallet-duplicate'], {
      state: {
        walletId: this.wallet.credentials.walletId
      }
    });
  }

  public hiddenWalletChange(walletId: string): void {
    if (!walletId) return;
    this.profileProvider.toggleHideWalletFlag(walletId);
    if (!!this.wallet.hidden)
      this.pushNotificationsProvider.unsubscribe(this.wallet);
    else this.pushNotificationsProvider.updateSubscription(this.wallet);
  }

  public openWalletGroupDelete(): void {
    this.router.navigate(['/wallet-delete'], {
      state: {
        keyId: this.wallet.keyId,
        walletId: this.wallet.id
      }
    });
  }
}
