import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

import { Logger } from '@nsalaun/ng-logger';

import { TermsOfUsePage } from '../terms-of-use/terms-of-use';

import { AppProvider } from '../../providers/app-provider/app-provider';

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
  ) {}

  ionViewDidLoad() {
    this.log.log('ionViewDidLoad AboutPage');
    this.app.getCommitHash().subscribe((data) => {
      this.commitHash = data;
    });
    this.app.getVersion().subscribe((data) => {
      this.version = data;
    });
  }

  openTermsOfUse() {
    this.navCtrl.push(TermsOfUsePage);
  }

}
