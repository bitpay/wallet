import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Logger } from '../../providers/logger/logger';

// providers
import { AppProvider } from '../../providers/app/app';

import { ActionSheetProvider } from '../../providers/action-sheet/action-sheet';
import { PlatformProvider } from '../../providers/platform/platform';
import { ImportWalletPage } from '../add/import-wallet/import-wallet';
import { TourPage } from './tour/tour';

@Component({
  selector: 'page-onboarding',
  templateUrl: 'onboarding.html'
})
export class OnboardingPage {
  public isCopay: boolean;
  public appName: string;
  public isElectron: boolean;

  constructor(
    public navCtrl: NavController,
    private logger: Logger,
    private app: AppProvider,
    private platformProvider: PlatformProvider,
    private actionSheetProvider: ActionSheetProvider
  ) {
    this.appName = this.app.info.nameCase;
    this.isCopay = this.appName == 'Copay' ? true : false;
    this.isElectron = this.platformProvider.isElectron;
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: OnboardingPage');
  }

  ionViewDidEnter() {
    if (this.isElectron) this.openElectronInfoModal();
  }

  public getStarted(): void {
    this.navCtrl.push(TourPage);
  }

  public restoreFromBackup(): void {
    this.navCtrl.push(ImportWalletPage, { fromOnboarding: true });
  }

  public openElectronInfoModal(): void {
    const infoSheet = this.actionSheetProvider.createInfoSheet(
      'electron-info',
      {
        appName: this.appName
      }
    );
    infoSheet.present();
  }
}
