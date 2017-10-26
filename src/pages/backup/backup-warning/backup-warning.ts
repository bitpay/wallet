import { Component } from '@angular/core';
import { NavController, NavParams, ModalController } from 'ionic-angular';
import { BackupWarningModalPage } from '../backup-warning-modal/backup-warning-modal';

@Component({
  selector: 'page-backup-warning',
  templateUrl: 'backup-warning.html',
})
export class BackupWarningPage {

  public currentIndex: number;

  constructor(public navCtrl: NavController, public navParams: NavParams, public modalCtrl: ModalController) {
  }

  ionViewDidLoad() {
  }

  openWarningModal() {
    const myModal = this.modalCtrl.create(BackupWarningModalPage, {}, {
      showBackdrop: true,
      enableBackdropDismiss: true,
      cssClass: "backup-modal-warning"
    });
    myModal.present();
  }

}
