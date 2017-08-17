import { Component } from '@angular/core';
import { IonicPage, NavController, ViewController } from 'ionic-angular';

@IonicPage()
@Component({
  selector: 'page-backup-warning-modal',
  templateUrl: 'backup-warning-modal.html',
})
export class BackupWarningModalPage {

  constructor(public navCtrl: NavController, public viewCtrl: ViewController) {
  }

  ionViewDidLoad() {
  }

  close() {
    this.navCtrl.push('BackupGamePage');
    this.viewCtrl.dismiss();
  }

}
