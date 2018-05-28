import { Component } from '@angular/core';
import {
  AlertController,
  ModalController,
  NavController,
  NavParams
} from 'ionic-angular';

// pages
import { BackupGamePage } from '../backup-game/backup-game';

// components
import { CustomModalComponent } from '../../../components/custom-modal/custom-modal';

@Component({
  selector: 'page-backup-warning',
  templateUrl: 'backup-warning.html'
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

  public openWarningModal(): void {
    let BackupWarningModal = this.modalCtrl.create(
      CustomModalComponent,
      { modal: 'backup-warning' },
      { cssClass: 'fullscreen-modal' }
    );
    BackupWarningModal.present({ animate: false });
    BackupWarningModal.onDidDismiss(response => {
      if (response) {
        this.navCtrl.push(BackupGamePage, {
          walletId: this.walletId,
          fromOnboarding: this.fromOnboarding
        });
      }
    });
  }
}
