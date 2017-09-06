import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

import { AppProvider } from '../../providers/app/app';
import { LanguageProvider } from '../../providers/language/language';
import { UnitProvider } from '../../providers/unit/unit';

import { AboutPage } from './about/about';

@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html',
})
export class SettingsPage {
  appName: string;
  currentLanguage: string;
  currentUnitCode: string;
  unitList: Array<any>;
  languages: Array<any>;
  bitcoinUnit: Array<string>

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private app: AppProvider,
    private language: LanguageProvider,
    private unit: UnitProvider
  ) {
    this.appName = this.app.info.nameCase;

    this.currentUnitCode = this.unit.getCode();
    this.unitList = this.unit.getList();

    this.currentLanguage = this.language.getCurrent();
    this.languages = this.language.getAvailables();
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad SettingsPage');
  }

  setLanguage(lang: string) {
    this.currentLanguage = lang;
    this.language.set(lang);
  }

  setUnit(code: string) {
    this.unit.setUnit(code);
  }

  openAboutPage() {
    this.navCtrl.push(AboutPage);
  }

}
