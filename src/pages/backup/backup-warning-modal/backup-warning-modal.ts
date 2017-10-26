import { Component } from '@angular/core';
import { NavController, ViewController } from 'ionic-angular';
import { BackupGamePage } from '../backup-game/backup-game';

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
    this.navCtrl.push(BackupGamePage);
    this.viewCtrl.dismiss();
  }

}
