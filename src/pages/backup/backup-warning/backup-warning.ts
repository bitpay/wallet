import { Component } from '@angular/core';
import { AlertController, NavController, NavParams } from 'ionic-angular';

// pages
import { BackupGamePage } from '../backup-game/backup-game';

import { PopupProvider } from '../../../providers/popup/popup';

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
    public popupProvider: PopupProvider
  ) {
    this.walletId = this.navParams.get('walletId');
    this.fromOnboarding = this.navParams.get('fromOnboarding');
  }

  public openWarningModal(): void {
    const backupWarningModal = this.popupProvider.createMiniModal(
      'backup-warning'
    );
    backupWarningModal.present({ animate: false });
    backupWarningModal.onDidDismiss(response => {
      if (response) {
        this.navCtrl.push(BackupGamePage, {
          walletId: this.walletId,
          fromOnboarding: this.fromOnboarding
        });
      }
    });
  }
}
