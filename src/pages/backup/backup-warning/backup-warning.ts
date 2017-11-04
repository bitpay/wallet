import { Component } from '@angular/core';
import { NavController, ModalController, AlertController } from 'ionic-angular';
import { BackupGamePage } from '../backup-game/backup-game';

@Component({
  selector: 'page-backup-warning',
  templateUrl: 'backup-warning.html',
})
export class BackupWarningPage {
  public currentIndex: number;

  constructor(
    public navCtrl: NavController,
    public alertCtrl: AlertController,
    public modalCtrl: ModalController
  ) {}

  openWarningModal() {

    let opts = {
      title: 'Screenshots are not secure',
      message: 'If you take a screenshot, your backup may be viewed by other apps. You can make a safe backup with physical paper and a pen',
      buttons: [{
        text: 'I understand',
        handler: () => {
          this.navCtrl.push(BackupGamePage);
        }
      }],
    }
    this.alertCtrl.create(opts).present();
  }

}
