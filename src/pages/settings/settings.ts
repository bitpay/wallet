import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Logger } from '../../providers/logger/logger';
import { TranslateService } from '@ngx-translate/core';

//providers
import { AppProvider } from '../../providers/app/app';
import { ConfigProvider } from '../../providers/config/config';
import { LanguageProvider } from '../../providers/language/language';
import { ExternalLinkProvider } from '../../providers/external-link/external-link';
import { ProfileProvider } from '../../providers/profile/profile';
import { PlatformProvider } from '../../providers/platform/platform';
import { HomeIntegrationsProvider } from '../../providers/home-integrations/home-integrations';

//pages
import { AltCurrencyPage } from './alt-currency/alt-currency';
import { BitcoinCashPage } from './bitcoin-cash/bitcoin-cash';
import { LockPage } from './lock/lock';
import { AboutPage } from './about/about';
import { AdvancedPage } from './advanced/advanced';
import { AddressbookPage } from './addressbook/addressbook';
import { WalletSettingsPage } from './wallet-settings/wallet-settings';
import { NotificationsPage } from './notifications/notifications';
import { FeePolicyPage } from './fee-policy/fee-policy';
import { LanguagePage } from './language/language';
import { FeedbackCompletePage } from '../feedback/feedback-complete/feedback-complete';
import { SendFeedbackPage } from '../feedback/send-feedback/send-feedback';
import { GlideraSettingsPage } from '../integrations/glidera/glidera-settings/glidera-settings';
import { CoinbaseSettingsPage } from '../integrations/coinbase/coinbase-settings/coinbase-settings';
import { EnabledServicesPage } from './enabled-services/enabled-services';
import { BitPaySettingsPage } from '../integrations/bitpay-card/bitpay-settings/bitpay-settings';

@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html'
})
export class SettingsPage {
  public appName: string;
  public currentLanguageName: string;
  public languages: Array<any>;
  public walletsBtc: Array<any>;
  public walletsBch: Array<any>;
  public config: any;
  public selectedAlternative: any;
  public isCordova: boolean;
  public isWindowsPhoneApp: boolean;
  public lockMethod: string;
  public exchangeServices: Array<any> = [];
  public bitpayCardEnabled: boolean = false;

  constructor(
    private navCtrl: NavController,
    private app: AppProvider,
    private language: LanguageProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private profileProvider: ProfileProvider,
    private configProvider: ConfigProvider,
    private logger: Logger,
    private homeIntegrationsProvider: HomeIntegrationsProvider,
    private platformProvider: PlatformProvider,
    private translate: TranslateService
  ) {
    this.appName = this.app.info.nameCase;
    this.currentLanguageName = this.language.getName(this.language.getCurrent());
    this.walletsBch = [];
    this.walletsBtc = [];
    this.isCordova = this.platformProvider.isCordova;
    this.isWindowsPhoneApp = this.platformProvider.isWP;
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad SettingsPage');
  }

  ionViewWillEnter() {
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
    }
    this.lockMethod = this.config.lock.method;
    this.exchangeServices = this.homeIntegrationsProvider.getAvailableExchange();

    if (this.app.info._enabledExtensions.debitcard) {
      this.bitpayCardEnabled = true;
    }
  }

  public openBitcoinCashPage(): void {
    this.navCtrl.push(BitcoinCashPage);
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

  public openLockPage(): void {
    this.navCtrl.push(LockPage);
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
    this.navCtrl.push(WalletSettingsPage, { walletId: walletId });
  }

  public openSendFeedbackPage(): void {
    this.navCtrl.push(SendFeedbackPage);
  }

  public openFeedbackCompletePage(): void {
    this.navCtrl.push(FeedbackCompletePage, { score: 4, skipped: true, fromSettings: true });
  }

  public openEnabledServicesPage(): void {
    this.navCtrl.push(EnabledServicesPage);
  }

  public openBitPaySettings(): void {
    this.navCtrl.push(BitPaySettingsPage);
  }

  public openIntegrationSettings(name: string): void {
    switch (name) {
      case 'coinbase':
        this.navCtrl.push(CoinbaseSettingsPage);
        break;
      case 'glidera':
        this.navCtrl.push(GlideraSettingsPage);
        break;
    }
  }

  public openHelpExternalLink(): void {
    let url = this.appName == 'Copay' ? 'https://github.com/bitpay/copay/issues' : 'https://help.bitpay.com/bitpay-app';
    let optIn = true;
    let title = null;
    let message = this.translate.instant('Help and support information is available at the website.');
    let okText = this.translate.instant('Open');
    let cancelText = this.translate.instant('Go Back');
    this.externalLinkProvider.open(url, optIn, title, message, okText, cancelText);
  }
}
