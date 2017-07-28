import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

import { Logger } from '@nsalaun/ng-logger';

import { TermsOfUsePage } from '../terms-of-use/terms-of-use';

import { AppService } from '../../providers/app-service/app-service';

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
    private appSrv: AppService,
    private log: Logger
  ) {}

  ionViewDidLoad() {
    this.log.log('ionViewDidLoad AboutPage');
    this.appSrv.getCommitHash().subscribe((data) => {
      this.commitHash = data;
    });
    this.appSrv.getVersion().subscribe((data) => {
      this.version = data;
    });
  }

  openTermsOfUse() {
    this.navCtrl.push(TermsOfUsePage);
  }

}
