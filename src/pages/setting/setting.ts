import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

import { AppProvider } from '../../providers/app/app';
import { TranslateService } from '@ngx-translate/core';

import { AboutPage } from '../about/about';

@Component({
  selector: 'page-setting',
  templateUrl: 'setting.html',
})
export class SettingPage {
  language: string;
  appName: string;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public app: AppProvider,
    public i18n: TranslateService,
  ) {
    app.getName().subscribe((data) => {
      this.appName = data;
      this.language = i18n.currentLang;
    });
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad SettingPage');
  }

  openAboutPage() {
    this.navCtrl.push(AboutPage);
  }

}
