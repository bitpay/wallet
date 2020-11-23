import { Component } from '@angular/core';
import { NavController, NavParams, Platform } from 'ionic-angular';

// Providers
import { ActionSheetProvider } from '../../../providers/action-sheet/action-sheet';
import { AppProvider } from '../../../providers/app/app';
import { Logger } from '../../../providers/logger/logger';

// Pages
import { BackupKeyPage } from '../../../pages/backup/backup-key/backup-key';
import { DisclaimerPage } from '../../../pages/onboarding/disclaimer/disclaimer';

@Component({
  selector: 'page-recovery-key',
  templateUrl: 'recovery-key.html'
})
export class RecoveryKeyPage {
  private unregisterBackButtonAction;
  public isOnboardingFlow: boolean;
  public appName: string;

  constructor(
    public navCtrl: NavController,
    private navParams: NavParams,
    private logger: Logger,
    private actionSheetProvider: ActionSheetProvider,
    private platform: Platform,
    private appProvider: AppProvider
  ) {
    this.appName = this.appProvider.info.nameCase;
    this.isOnboardingFlow = this.navParams.data.isOnboardingFlow;
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: RecoveryKeyPage');
  }

  ionViewWillEnter() {
    this.initializeBackButtonHandler();
  }

  ionViewWillLeave() {
    this.unregisterBackButtonAction && this.unregisterBackButtonAction();
  }

  public goToBackupKey(): void {
    this.navCtrl.push(BackupKeyPage, {
      keyId: this.navParams.data.keyId,
      isOnboardingFlow: this.isOnboardingFlow
    });
  }

  public showInfoSheet() {
    const infoSheet = this.actionSheetProvider.createInfoSheet(
      'backup-later-warning'
    );
    infoSheet.present();
    infoSheet.onDidDismiss(option => {
      if (option) {
        this.isOnboardingFlow
          ? this.navCtrl.push(DisclaimerPage, {
              keyId: this.navParams.data.keyId
            })
          : this.navCtrl.pop();
      }
    });
  }

  private initializeBackButtonHandler(): void {
    this.unregisterBackButtonAction = this.platform.registerBackButtonAction(
      () => {
        this.showInfoSheet();
      }
    );
  }
}
