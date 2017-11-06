import { Component } from '@angular/core';
import { NavController, NavParams, ModalController, AlertController } from 'ionic-angular';
import { BackupGamePage } from '../backup-game/backup-game';

@Component({
  selector: 'page-backup-warning',
  templateUrl: 'backup-warning.html',
})
export class BackupWarningPage {
  public currentIndex: number;
  private walletId: string;
  private fromOnboarding: boolean;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public alertCtrl: AlertController,
    public modalCtrl: ModalController
  ) {
    this.walletId = this.navParams.get('walletId');
    this.fromOnboarding = this.navParams.get('fromOnboarding');
  }

  openWarningModal() {

    let opts = {
      title: 'Screenshots are not secure',
      message: 'If you take a screenshot, your backup may be viewed by other apps. You can make a safe backup with physical paper and a pen',
      buttons: [{
        text: 'I understand',
        handler: () => {
          this.navCtrl.push(BackupGamePage, {walletId: this.walletId, fromOnboarding: this.fromOnboarding});
        }
      }],
    }
    this.alertCtrl.create(opts).present();
  }

}
