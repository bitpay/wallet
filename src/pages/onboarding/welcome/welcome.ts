import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

/**
 * Generated class for the WelcomePage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-welcome',
  templateUrl: 'welcome.html',
})
export class WelcomePage {
  tabBarElement: any;

  constructor(public navCtrl: NavController, public navParams: NavParams) {
  }

  getStarted() {
    this.navCtrl.push('TourPage');
  }

  restoreFromBackup() {
    // TODO navigate to backup flow
    this.navCtrl.push('BackupWarningPage');
  }

}
