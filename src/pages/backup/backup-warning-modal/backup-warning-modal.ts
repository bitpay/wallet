import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController } from 'ionic-angular';

@IonicPage()
@Component({
  selector: 'page-backup-warning-modal',
  templateUrl: 'backup-warning-modal.html',
})
export class BackupWarningModalPage {

  constructor(public navCtrl: NavController, public navParams: NavParams, public viewCtrl: ViewController) {
  }

  ionViewDidLoad() {
  }

  close() {
    this.navCtrl.push('BackupGamePage');
    this.viewCtrl.dismiss();
  }

}
