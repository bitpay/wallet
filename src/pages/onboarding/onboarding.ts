import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

// Providers
import { Logger } from '../../providers/logger/logger';

// Pages
import { FeatureEducationPage } from '../../pages/onboarding/feature-education/feature-education';
@Component({
  selector: 'page-onboarding',
  templateUrl: 'onboarding.html'
})
export class OnboardingPage {
  constructor(private navCtrl: NavController, private logger: Logger) {}

  ionViewDidLoad() {
    this.logger.info('Loaded: OnboardingPage');
  }

  public getStarted(): void {
    this.navCtrl.push(FeatureEducationPage);
  }
}
