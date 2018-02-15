import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Logger } from '../../providers/logger/logger';

import { ImportWalletPage } from '../add/import-wallet/import-wallet';
import { TourPage } from './tour/tour';

@Component({
  selector: 'page-onboarding',
  templateUrl: 'onboarding.html'
})
export class OnboardingPage {
  constructor(public navCtrl: NavController, private logger: Logger) {}

  public ionViewDidLoad() {
    this.logger.info('ionViewDidLoad OnboardingPage');
  }

  public getStarted() {
    this.navCtrl.push(TourPage);
  }

  public restoreFromBackup() {
    this.navCtrl.push(ImportWalletPage, { fromOnboarding: true });
  }
}
