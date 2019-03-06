import { Component } from '@angular/core';
import { AlertController, NavController, NavParams } from 'ionic-angular';

// pages
import { BackupKeyPage } from '../backup-key/backup-key';

import { ActionSheetProvider } from '../../../providers/action-sheet/action-sheet';

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
    public actionSheetProvider: ActionSheetProvider
  ) {
    this.walletId = this.navParams.data.walletId;
    this.fromOnboarding = this.navParams.data.fromOnboarding;
  }

  public openWarningModal(): void {
    const infoSheet = this.actionSheetProvider.createInfoSheet(
      'backup-warning'
    );
    infoSheet.present();
    infoSheet.onDidDismiss(option => {
      if (option) {
        this.navCtrl.push(BackupKeyPage, {
          walletId: this.walletId,
          fromOnboarding: this.fromOnboarding
        });
      }
    });
  }
}
