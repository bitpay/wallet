import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ModalController, NavController } from 'ionic-angular';
import { Logger } from '../../providers/logger/logger';

import * as _ from 'lodash';

// providers
import { ActionSheetProvider } from '../../providers/action-sheet/action-sheet';
import { AppProvider } from '../../providers/app/app';
import { BitPayCardProvider } from '../../providers/bitpay-card/bitpay-card';
import { ConfigProvider } from '../../providers/config/config';
import { ExternalLinkProvider } from '../../providers/external-link/external-link';
import { HomeIntegrationsProvider } from '../../providers/home-integrations/home-integrations';
import { LanguageProvider } from '../../providers/language/language';
import { PersistenceProvider } from '../../providers/persistence/persistence';
import { PlatformProvider } from '../../providers/platform/platform';
import { ProfileProvider } from '../../providers/profile/profile';
import { TouchIdProvider } from '../../providers/touchid/touchid';
import { WalletProvider } from '../../providers/wallet/wallet';

// pages
import { BackupWarningPage } from '../backup/backup-warning/backup-warning';
import { BitPaySettingsPage } from '../integrations/bitpay-card/bitpay-settings/bitpay-settings';
import { CoinbaseSettingsPage } from '../integrations/coinbase/coinbase-settings/coinbase-settings';
import { GiftCardsSettingsPage } from '../integrations/gift-cards/gift-cards-settings/gift-cards-settings';
import { GlideraSettingsPage } from '../integrations/glidera/glidera-settings/glidera-settings';
import { ShapeshiftSettingsPage } from '../integrations/shapeshift/shapeshift-settings/shapeshift-settings';
import { PinModalPage } from '../pin/pin-modal/pin-modal';
import { AboutPage } from './about/about';
import { AddressbookPage } from './addressbook/addressbook';
import { AdvancedPage } from './advanced/advanced';
import { AltCurrencyPage } from './alt-currency/alt-currency';
import { FeePolicyPage } from './fee-policy/fee-policy';
import { LanguagePage } from './language/language';
import { LockPage } from './lock/lock';
import { NotificationsPage } from './notifications/notifications';
import { SharePage } from './share/share';
import { VaultDeletePage } from './vault-delete/vault-delete';
import { WalletSettingsPage } from './wallet-settings/wallet-settings';

@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html'
})
export class SettingsPage {
  public appName: string;
  public currentLanguageName: string;
  public languages;
  public walletsBtc;
  public walletsBch;
  public config;
  public selectedAlternative;
  public isCordova: boolean;
  public lockMethod: string;
  public integrationServices = [];
  public bitpayCardItems = [];
  public showBitPayCard: boolean = false;
  public vault;
  public encryptEnabled: boolean;
  public touchIdAvailable: boolean;
  public touchIdEnabled: boolean;
  public touchIdPrevValue: boolean;

  private vaultWallets;

  constructor(
    private navCtrl: NavController,
    private app: AppProvider,
    private language: LanguageProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private profileProvider: ProfileProvider,
    private configProvider: ConfigProvider,
    private logger: Logger,
    private homeIntegrationsProvider: HomeIntegrationsProvider,
    private bitPayCardProvider: BitPayCardProvider,
    private platformProvider: PlatformProvider,
    private translate: TranslateService,
    private modalCtrl: ModalController,
    private touchid: TouchIdProvider,
    private persistenceProvider: PersistenceProvider,
    private walletProvider: WalletProvider,
    private actionSheetProvider: ActionSheetProvider,
    private touchIdProvider: TouchIdProvider
  ) {
    this.appName = this.app.info.nameCase;
    this.walletsBch = [];
    this.walletsBtc = [];
    this.isCordova = this.platformProvider.isCordova;
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: SettingsPage');
  }

  ionViewWillEnter() {
    this.currentLanguageName = this.language.getName(
      this.language.getCurrent()
    );
    this.walletsBtc = this.profileProvider.getWallets({
      coin: 'btc'
    });
    this.walletsBch = this.profileProvider.getWallets({
      coin: 'bch'
    });
    this.config = this.configProvider.get();
    this.selectedAlternative = {
      name: this.config.wallet.settings.alternativeName,
      isoCode: this.config.wallet.settings.alternativeIsoCode
    };
    this.lockMethod =
      this.config && this.config.lock && this.config.lock.method
        ? this.config.lock.method.toLowerCase()
        : null;
    this.persistenceProvider.getVault().then(vault => {
      this.vault = vault;
      const wallets = this.profileProvider.getWallets();
      this.vaultWallets = _.filter(wallets, (x: any) => {
        return (
          this.vault && this.vault.walletIds.includes(x.credentials.walletId)
        );
      });
      this.encryptEnabled = this.walletProvider.isEncrypted(
        this.vaultWallets[0]
      );
      this.touchIdEnabled = this.config.touchIdFor
        ? this.config.touchIdFor[this.vaultWallets[0].credentials.walletId]
        : null;
      this.touchIdPrevValue = this.touchIdEnabled;
    });
    this.touchIdProvider.isAvailable().then((isAvailable: boolean) => {
      this.touchIdAvailable = isAvailable;
    });
  }

  public touchIdChange(): void {
    if (this.touchIdPrevValue == this.touchIdEnabled) return;
    const newStatus = this.touchIdEnabled;
    this.walletProvider
      .setTouchId(this.vaultWallets, newStatus)
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

    if (val && !this.walletProvider.isEncrypted(this.vaultWallets[0])) {
      this.logger.debug('Encrypting private key for vault: ', this.vault.name);
      this.walletProvider
        .encrypt(this.vaultWallets)
        .then(() => {
          this.vaultWallets.forEach(wallet => {
            this.profileProvider.updateCredentials(JSON.parse(wallet.export()));
          });
          this.logger.debug('Vault wallets encrypted');
        })
        .catch(err => {
          this.encryptEnabled = false;
          const title = this.translate.instant('Could not encrypt wallet');
          this.showErrorInfoSheet(err, title);
        });
    } else if (!val && this.walletProvider.isEncrypted(this.vaultWallets[0])) {
      this.walletProvider
        .decrypt(this.vaultWallets)
        .then(() => {
          this.vaultWallets.forEach(wallet => {
            this.profileProvider.updateCredentials(JSON.parse(wallet.export()));
          });
          this.logger.debug('Vault wallets decrypted');
        })
        .catch(err => {
          this.encryptEnabled = true;
          const title = this.translate.instant(
            'Could not decrypt vault wallets'
          );
          this.showErrorInfoSheet(err, title);
        });
    }
  }

  private showErrorInfoSheet(
    err: Error | string,
    infoSheetTitle: string
  ): void {
    if (!err) return;
    this.logger.warn('Could not encrypt/decrypt vault wallets:', err);
    const errorInfoSheet = this.actionSheetProvider.createInfoSheet(
      'default-error',
      { msg: err, title: infoSheetTitle }
    );
    errorInfoSheet.present();
  }

  ionViewDidEnter() {
    // Show integrations
    const integrations = this.homeIntegrationsProvider.get();

    // Hide BitPay if linked
    setTimeout(() => {
      this.integrationServices = _.remove(_.clone(integrations), x => {
        if (x.name == 'debitcard' && x.linked) return;
        else return x;
      });
    }, 200);

    // Only BitPay Wallet
    this.bitPayCardProvider.get({}, (_, cards) => {
      this.showBitPayCard = this.app.info._enabledExtensions.debitcard
        ? true
        : false;
      this.bitpayCardItems = cards;
    });
  }

  public openAltCurrencyPage(): void {
    this.navCtrl.push(AltCurrencyPage);
  }

  public openLanguagePage(): void {
    this.navCtrl.push(LanguagePage);
  }

  public openAdvancedPage(): void {
    this.navCtrl.push(AdvancedPage);
  }

  public openAboutPage(): void {
    this.navCtrl.push(AboutPage);
  }

  public openBackupSettings(): void {
    const vaultWallet = this.profileProvider.getWallet(this.vault.walletIds[0]);
    this.navCtrl.push(BackupWarningPage, {
      walletId: vaultWallet.credentials.walletId
    });
  }

  public openLockPage(): void {
    const config = this.configProvider.get();
    const lockMethod =
      config && config.lock && config.lock.method
        ? config.lock.method.toLowerCase()
        : null;
    if (!lockMethod || lockMethod == 'disabled') this.navCtrl.push(LockPage);
    if (lockMethod == 'pin') this.openPinModal('lockSetUp');
    if (lockMethod == 'fingerprint') this.checkFingerprint();
  }

  public openAddressBookPage(): void {
    this.navCtrl.push(AddressbookPage);
  }

  public openNotificationsPage(): void {
    this.navCtrl.push(NotificationsPage);
  }

  public openFeePolicyPage(): void {
    this.navCtrl.push(FeePolicyPage);
  }

  public openWalletSettingsPage(walletId: string): void {
    this.navCtrl.push(WalletSettingsPage, { walletId });
  }

  public openSharePage(): void {
    this.navCtrl.push(SharePage);
  }

  public openSettingIntegration(name: string): void {
    switch (name) {
      case 'coinbase':
        this.navCtrl.push(CoinbaseSettingsPage);
        break;
      case 'debitcard':
        this.navCtrl.push(BitPaySettingsPage);
        break;
      case 'glidera':
        this.navCtrl.push(GlideraSettingsPage);
        break;
      case 'shapeshift':
        this.navCtrl.push(ShapeshiftSettingsPage);
        break;
      case 'giftcards':
        this.navCtrl.push(GiftCardsSettingsPage);
        break;
    }
  }

  public openCardSettings(id): void {
    this.navCtrl.push(BitPaySettingsPage, { id });
  }

  public openGiftCardsSettings() {
    this.navCtrl.push(GiftCardsSettingsPage);
  }

  public openDeleteVault(): void {
    this.navCtrl.push(VaultDeletePage);
  }

  public openHelpExternalLink(): void {
    const url =
      this.appName == 'Copay'
        ? 'https://github.com/bitpay/copay/issues'
        : 'https://help.bitpay.com/bitpay-app';
    const optIn = true;
    const title = null;
    const message = this.translate.instant(
      'Help and support information is available at the website.'
    );
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

  private openPinModal(action): void {
    const modal = this.modalCtrl.create(
      PinModalPage,
      { action },
      { cssClass: 'fullscreen-modal' }
    );
    modal.present();
    modal.onDidDismiss(cancelClicked => {
      if (!cancelClicked) this.navCtrl.push(LockPage);
    });
  }

  private checkFingerprint(): void {
    this.touchid.check().then(() => {
      this.navCtrl.push(LockPage);
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
