import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

import { Logger } from '@nsalaun/ng-logger';

import { TermsOfUsePage } from '../terms-of-use/terms-of-use';

import { AppProvider } from '../../providers/app/app';

@Component({
  selector: 'page-about',
  templateUrl: 'about.html',
})
export class AboutPage {
  version: string;
  commitHash: string;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private app: AppProvider,
    private log: Logger
  ) { }

  ionViewDidLoad() {
    this.log.log('ionViewDidLoad AboutPage');
    this.commitHash = this.app.info.commitHash;
    this.version = this.app.info.version;
  }

  openTermsOfUse() {
    this.navCtrl.push(TermsOfUsePage);
  }

}
