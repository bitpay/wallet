import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Logger } from '../../providers/logger/logger';

// providers
import { AppProvider } from '../../providers/app/app';

import { ImportWalletPage } from '../add/import-wallet/import-wallet';
import { TourPage } from './tour/tour';

@Component({
  selector: 'page-onboarding',
  templateUrl: 'onboarding.html'
})
export class OnboardingPage {
  public isCopay: boolean;

  constructor(
    public navCtrl: NavController,
    private logger: Logger,
    private app: AppProvider
  ) {
    this.isCopay = this.app.info.nameCase == 'Copay' ? true : false;
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: OnboardingPage');
  }

  public getStarted(): void {
    this.navCtrl.push(TourPage);
  }

  public restoreFromBackup(): void {
    this.navCtrl.push(ImportWalletPage, { fromOnboarding: true });
  }
}
