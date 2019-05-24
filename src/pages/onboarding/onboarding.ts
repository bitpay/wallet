import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Logger } from '../../providers/logger/logger';

// pages

import { DisclaimerPage } from '../../pages/onboarding/disclaimer/disclaimer';
@Component({
  selector: 'page-onboarding',
  templateUrl: 'onboarding.html'
})
export class OnboardingPage {
  public appName: string;
  public isElectron: boolean;

  constructor(private navCtrl: NavController, private logger: Logger) {}

  ionViewDidLoad() {
    this.logger.info('Loaded: OnboardingPage');
  }

  public getStarted(): void {
    this.navCtrl.push(DisclaimerPage);
  }
}
