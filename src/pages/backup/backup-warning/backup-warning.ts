import { Component } from '@angular/core';
import { ModalController } from 'ionic-angular';
import { BackupWarningModalPage } from '../backup-warning-modal/backup-warning-modal';

@Component({
  selector: 'page-backup-warning',
  templateUrl: 'backup-warning.html',
})
export class BackupWarningPage {
  public currentIndex: number;

  constructor(public modalCtrl: ModalController) {}

  openWarningModal() {
    const myModal = this.modalCtrl.create(BackupWarningModalPage, {}, {
      showBackdrop: true,
      enableBackdropDismiss: true,
    });
    myModal.present();
  }

}
