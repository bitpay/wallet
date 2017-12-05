import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { ModalController } from 'ionic-angular';

//providers
import { AppProvider } from '../../providers/app/app';
import { LanguageProvider } from '../../providers/language/language';
import { ExternalLinkProvider } from '../../providers/external-link/external-link';
import { ProfileProvider } from '../../providers/profile/profile';

//pages
import { AltCurrencyPage } from './alt-currency/alt-currency';
import { LockPage } from './lock/lock';
import { AboutPage } from './about/about';
import { AdvancedPage } from './advanced/advanced';
import { AddressbookPage } from './addressbook/addressbook';
import { WalletSettingsPage } from './wallet-settings/wallet-settings';
import { NotificationsPage } from './notifications/notifications';
import { FeePolicyPage } from './fee-policy/fee-policy';

@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html',
})
export class SettingsPage {
  public appName: string;
  public currentLanguage: string;
  public languages: Array<any>;
  public walletsBtc: Array<any>;
  public walletsBch: Array<any>;

  constructor(
    private modalCtrl: ModalController,
    private navCtrl: NavController,
    private app: AppProvider,
    private language: LanguageProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private profileProvider: ProfileProvider
  ) {
    this.appName = this.app.info.nameCase;
    this.currentLanguage = this.language.getCurrent();
    this.languages = this.language.getAvailables();
    this.walletsBch = [];
    this.walletsBtc = [];
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad SettingsPage');
  }

  ionViewWillEnter() {
    this.walletsBtc = this.profileProvider.getWallets({
      coin: 'btc'
    });
    this.walletsBch = this.profileProvider.getWallets({
      coin: 'bch'
    });
  }

  altCurrencyModal() {
    let modal = this.modalCtrl.create(AltCurrencyPage);
    modal.present();
  }

  setLanguage(lang: string) {
    this.currentLanguage = lang;
    this.language.set(lang);
  }

  openAdvancedPage() {
    this.navCtrl.push(AdvancedPage);
  }

  openAboutPage() {
    this.navCtrl.push(AboutPage);
  }

  openLockPage() {
    this.navCtrl.push(LockPage);
  }

  openAddressBookPage() {
    this.navCtrl.push(AddressbookPage);
  }

  openNotificationsPage() {
    this.navCtrl.push(NotificationsPage);
  }

  openFeePolicy() {
    this.navCtrl.push(FeePolicyPage);
  }

  openWalletSettings(walletId: string): void {
    this.navCtrl.push(WalletSettingsPage, { walletId: walletId });
  }

  openHelpExternalLink() {
    var url = this.appName == 'copay' ? 'https://github.com/bitpay/copay/issues' : 'https://help.bitpay.com/bitpay-app';
    var optIn = true;
    var title = null;
    var message = 'Help and support information is available at the website.'; // TODO gettextCatalog
    var okText = 'Open'; // TODO gettextCatalog
    var cancelText = 'Go Back'; // TODO gettextCatalog
    this.externalLinkProvider.open(url, optIn, title, message, okText, cancelText);
  }
}
