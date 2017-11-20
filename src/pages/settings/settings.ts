import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { ModalController } from 'ionic-angular';

//providers
import { AppProvider } from '../../providers/app/app';
import { LanguageProvider } from '../../providers/language/language';
import { RateProvider } from '../../providers/rate/rate';
import { ExternalLinkProvider } from '../../providers/external-link/external-link';
import { ProfileProvider } from '../../providers/profile/profile';

//pages
import { AltCurrencyPage } from './alt-currency/alt-currency';
import { LockPage } from './lock/lock';
import { AboutPage } from './about/about';
import { AdvancedPage } from './advanced/advanced';
import { AddressbookPage } from './addressbook/addressbook';
import { WalletSettingsPage } from './wallet-settings/wallet-settings';

@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html',
  providers: [RateProvider]
})
export class SettingsPage {
  public appName: string;
  public currentLanguage: string;
  public languages: Array<any>;
  public walletsBtc: any;

  constructor(
    private modalCtrl: ModalController,
    private navCtrl: NavController,
    private navParams: NavParams,
    private app: AppProvider,
    private language: LanguageProvider,
    private rate: RateProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private profileProvider: ProfileProvider
  ) {
    this.appName = this.app.info.nameCase;
    this.currentLanguage = this.language.getCurrent();
    this.languages = this.language.getAvailables();
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad SettingsPage');
  }

  ionViewDidEnter() {
    this.walletsBtc = this.profileProvider.getWallets({
      coin: 'btc'
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
