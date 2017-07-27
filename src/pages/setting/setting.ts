import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

import { AboutPage } from '../about/about';

@Component({
  selector: 'page-setting',
  templateUrl: 'setting.html',
})
export class SettingPage {
  items: Object[];

  constructor(public navCtrl: NavController, public navParams: NavParams) {
    this.items = [
      {
        name: 'Address book',
        page: null
      }, {
        name: 'About Copay',
        page: AboutPage
      }
    ];
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad SettingPage');
  }

  openPage(page: any) {
    if (!page) return;
    this.navCtrl.push(page);
  }

}
