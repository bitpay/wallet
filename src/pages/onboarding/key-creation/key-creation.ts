import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

// Providers
import { ActionSheetProvider } from '../../../providers/action-sheet/action-sheet';
import { AppProvider } from '../../../providers/app/app';
import { Logger } from '../../../providers/logger/logger';

// Pages
import { LockMethodPage } from '../../../pages/onboarding/lock-method/lock-method';

@Component({
  selector: 'page-key-creation',
  templateUrl: 'key-creation.html'
})
export class KeyCreationPage {
  public appName: string;

  constructor(
    public navCtrl: NavController,
    private logger: Logger,
    private appProvider: AppProvider,
    private actionSheetProvider: ActionSheetProvider
  ) {
    this.appName = this.appProvider.info.nameCase;
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: KeyCreationPage');
  }

  public showInfoSheet(nextViewName: string): void {
    const infoSheet = this.actionSheetProvider.createInfoSheet('protect-money');
    infoSheet.present();
    infoSheet.onDidDismiss(option => {
      if (option) this.goToLockMethodPage(nextViewName);
    });
  }

  private goToLockMethodPage(name: string): void {
    let nextView = {
      name,
      params: {
        isOnboardingFlow: true,
        isZeroState: true
      }
    };
    this.navCtrl.push(LockMethodPage, { nextView });
  }
}
