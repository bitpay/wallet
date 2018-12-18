import { Component } from '@angular/core';
import { StatusBar } from '@ionic-native/status-bar';
import { AlertController, NavController, NavParams } from 'ionic-angular';

// pages
import { BackupGamePage } from '../backup-game/backup-game';

// providers
import { ActionSheetProvider } from '../../../providers/action-sheet/action-sheet';
import { AppProvider } from '../../../providers/app/app';
import { ProfileProvider } from '../../../providers/profile/profile';

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
    public actionSheetProvider: ActionSheetProvider,
    private appProvider: AppProvider,
    private statusBar: StatusBar,
    private profileProvider: ProfileProvider
  ) {
    this.walletId = this.navParams.get('walletId');
    this.fromOnboarding = this.navParams.get('fromOnboarding');
  }


  ionViewWillEnter() {
    const defaultColor =
      this.appProvider.info.nameCase == 'Copay' ? '#192c3a' : '#2A3F90';
    this.statusBarBackgroundColor(defaultColor);
  }

  ionViewWillLeave() {
    if (!this.fromOnboarding) {
      const wallet = this.profileProvider.getWallet(this.walletId);
      this.statusBarBackgroundColor(wallet.color);
    }
  }

  public statusBarBackgroundColor(color: string): void {
    setTimeout(() => {
      this.statusBar.backgroundColorByHexString(color);
    }, 500);
  }

  public openWarningModal(): void {
    const infoSheet = this.actionSheetProvider.createInfoSheet(
      'backup-warning'
    );
    infoSheet.present();
    infoSheet.onDidDismiss(option => {
      if (option) {
        this.navCtrl.push(BackupGamePage, {
          walletId: this.walletId,
          fromOnboarding: this.fromOnboarding
        });
      }
    });
  }
}
