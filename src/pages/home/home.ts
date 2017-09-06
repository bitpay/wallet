import { Component } from '@angular/core';
import { IonicPage, NavController } from 'ionic-angular';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  constructor(public navCtrl: NavController) {

  }

  showOnboardingFlow() {
    this.navCtrl.push('WelcomePage');
  }

  showBackupFlow() {
    this.navCtrl.push('BackupWarningPage');
  }
}
