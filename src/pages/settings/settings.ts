import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Logger } from '@nsalaun/ng-logger';

//providers
import { AppProvider } from '../../providers/app/app';
import { ConfigProvider } from '../../providers/config/config';
import { LanguageProvider } from '../../providers/language/language';
import { ExternalLinkProvider } from '../../providers/external-link/external-link';
import { ProfileProvider } from '../../providers/profile/profile';

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

  constructor(
    private navCtrl: NavController,
    private app: AppProvider,
    private language: LanguageProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private profileProvider: ProfileProvider,
    private configProvider: ConfigProvider,
    private logger: Logger,
  ) {
    this.appName = this.app.info.nameCase;
    this.currentLanguageName = this.language.getName(this.language.getCurrent());
    this.walletsBch = [];
    this.walletsBtc = [];
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

  public openFeePolicy(): void {
    this.navCtrl.push(FeePolicyPage);
  }

  public openWalletSettings(walletId: string): void {
    this.navCtrl.push(WalletSettingsPage, { walletId: walletId });
  }

  public openHelpExternalLink(): void {
    var url = this.appName == 'copay' ? 'https://github.com/bitpay/copay/issues' : 'https://help.bitpay.com/bitpay-app';
    var optIn = true;
    var title = null;
    var message = 'Help and support information is available at the website.'; // TODO gettextCatalog
    var okText = 'Open'; // TODO gettextCatalog
    var cancelText = 'Go Back'; // TODO gettextCatalog
    this.externalLinkProvider.open(url, optIn, title, message, okText, cancelText);
  }
}
