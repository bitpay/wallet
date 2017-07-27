import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

import { AppService } from '../../providers/app-service/app-service';

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
    public appSrv: AppService
  ) {
    appSrv.getName().subscribe((data) => {
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
