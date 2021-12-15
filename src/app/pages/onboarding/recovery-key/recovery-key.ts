import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NavController, NavParams, Platform } from '@ionic/angular';
import { ActionSheetProvider } from 'src/app/providers/action-sheet/action-sheet';
import { EventManagerService } from 'src/app/providers/event-manager.service';
import { Logger } from 'src/app/providers/logger/logger';

// Providers

// Pages
import { BackupKeyPage } from '../../../pages/backup/backup-key/backup-key';
import { DisclaimerPage } from '../../../pages/onboarding/disclaimer/disclaimer';

@Component({
  selector: 'page-recovery-key',
  templateUrl: 'recovery-key.html',
  styleUrls: ['/recovery-key.scss']
})
export class RecoveryKeyPage {
  private unregisterBackButtonAction;
  public isOnboardingFlow: boolean;
  public hideBackButton: boolean;
  navParamsData;
  constructor(
    public navCtrl: NavController,
    private logger: Logger,
    private platform: Platform,
    private events: EventManagerService,
    private actionSheetProvider: ActionSheetProvider,
    private router: Router
  ) {

    if (this.router.getCurrentNavigation()) {
       this.navParamsData = this.router.getCurrentNavigation().extras.state ? this.router.getCurrentNavigation().extras.state : {};
    } else {
      this.navParamsData = history ? history.state : undefined;
    }
    if (this.navParamsData) {
      this.isOnboardingFlow = this.navParamsData.isOnboardingFlow;
      this.hideBackButton =
        this.isOnboardingFlow || this.navParamsData.hideBackButton;
    }

  }

  ngOnInit(){
    this.logger.info('Loaded: RecoveryKeyPage');
  }

  ionViewWillLeave() {
    this.unregisterBackButtonAction && this.unregisterBackButtonAction();
  }

  public goToBackupKey(): void {
    this.router.navigate(['/backup-key'], {
      state: { keyId: this.navParamsData.keyId, isOnboardingFlow: this.isOnboardingFlow },
    });
  }

  public showInfoSheet() {
    const infoSheet = this.actionSheetProvider.createInfoSheet(
      'backup-later-warning'
    );
    infoSheet.present();
    infoSheet.onDidDismiss(option => {
      if (option) {
        if (this.isOnboardingFlow) {
          this.router.navigate(['/disclaimer'], {
            state: { keyId: this.navParamsData.keyId },
          });
        } else {
          this.router.navigate([''], {replaceUrl: true}).then(() => {
            this.events.publish('Local/FetchWallets');
          })
        }
      }
    });
  }
}
