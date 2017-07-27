import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

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
    private appSrv: AppService
  ) {

    appSrv.getCommitHash().subscribe((data) => {
      this.commitHash = data;
    });
    appSrv.getVersion().subscribe((data) => {
      this.version = data;
    });
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad AboutPage');
  }

}
