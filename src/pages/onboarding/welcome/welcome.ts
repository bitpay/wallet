import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

@IonicPage()
@Component({
  selector: 'page-welcome',
  templateUrl: 'welcome.html',
})
export class WelcomePage {

  constructor(public navCtrl: NavController, public navParams: NavParams) {
  }

  ionViewDidLoad() {
  }

  getStarted() {
    this.navCtrl.push('TourPage');
  }

  initBackupFlow() {
    // TODO navigate to backupFlow
    this.navCtrl.push('BackupWarningPage');
  }

}
