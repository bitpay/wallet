import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

import { AppProvider } from '../../providers/app/app';

import { AboutPage } from '../about/about';

@Component({
  selector: 'page-setting',
  templateUrl: 'setting.html',
})
export class SettingPage {
  appName: string;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public app: AppProvider
  ) {
    app.getName().subscribe((data) => {
      this.appName = data;
    });
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad SettingPage');
  }

  openAboutPage() {
    this.navCtrl.push(AboutPage);
  }

}
