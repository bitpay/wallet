import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {
  ModalController,
  NavController,
  NavParams,
  Platform
} from '@ionic/angular';
import { ProfileProvider, ThemeProvider } from 'src/app/providers';
import { ActionSheetProvider } from 'src/app/providers/action-sheet/action-sheet';
import { EventManagerService } from 'src/app/providers/event-manager.service';
import { Logger } from 'src/app/providers/logger/logger';

// Providers

// Pages
import { DisclaimerModal } from '../../includes/disclaimer-modal/disclaimer-modal';

@Component({
  selector: 'page-recovery-key',
  templateUrl: 'recovery-key.html',
  styleUrls: ['./recovery-key.scss']
})
export class RecoveryKeyPage {
  private unregisterBackButtonAction;
  public isOnboardingFlow: boolean;
  public hideBackButton: boolean;
  navParamsData;
  themeCurrent: string;
  constructor(
    public navCtrl: NavController,
    private logger: Logger,
    private events: EventManagerService,
    private actionSheetProvider: ActionSheetProvider,
    private router: Router,
    private modalCtrl: ModalController,
    private themeProvider: ThemeProvider,
    private profileProvider: ProfileProvider
  ) {
    this.themeCurrent = this.themeProvider.currentAppTheme;
    if (this.router.getCurrentNavigation()) {
      this.navParamsData = this.router.getCurrentNavigation().extras.state
        ? this.router.getCurrentNavigation().extras.state
        : {};
    } else {
      this.navParamsData = history ? history.state : undefined;
    }
    if (this.navParamsData) {
      this.isOnboardingFlow = this.navParamsData.isOnboardingFlow;
    }
  }

  ngOnInit() {
    this.logger.info('Loaded: RecoveryKeyPage');
  }

  ionViewWillLeave() {
    this.unregisterBackButtonAction && this.unregisterBackButtonAction();
  }

  public async goToBackupKey(): Promise<void> {
    this.profileProvider.isDisclaimerAccepted().then(async onboardingState => {
      if (onboardingState === 'UNFINISHEDONBOARDING') {
        const modal = await this.modalCtrl.create({
          component: DisclaimerModal,
          backdropDismiss: false,
          cssClass: 'fixscreen-modal'
        });
        await modal.present();
        modal.onDidDismiss().then(({ data }) => {
          if (data.isConfirm) {
            this.router.navigate(['/backup-key'], {
              state: {
                keyId: this.navParamsData.keyId,
                isOnboardingFlow: this.isOnboardingFlow
              }
            });
          }
        });
      } else {
        this.router.navigate(['/backup-key'], {
          state: {
            keyId: this.navParamsData.keyId,
            isOnboardingFlow: this.isOnboardingFlow
          }
        });
      }
    });
  }

  public showInfoSheet() {
    const infoSheet = this.actionSheetProvider.createInfoSheet(
      'backup-later-warning'
    );
    infoSheet.present();
    infoSheet.onDidDismiss(option => {
      if (option) {
        this.router.navigate([''], { replaceUrl: true }).then(() => {
          this.events.publish('Local/FetchWallets');
        });
      }
    });
  }
}
