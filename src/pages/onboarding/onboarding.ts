import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Logger } from '@nsalaun/ng-logger';

import { TourPage } from './tour/tour';
import { TabsPage } from '../tabs/tabs';

@Component({
  selector: 'page-onboarding',
  templateUrl: 'onboarding.html',
})
export class OnboardingPage {

  constructor(
    public navCtrl: NavController,
    private log: Logger
  ) {
  }

  ionViewDidLoad() {
    this.log.info('ionViewDidLoad OnboardingPage');
  }

  getStarted() {
    this.navCtrl.push(TourPage);
  }

  restoreFromBackup() {
    // TODO navigate to backupFlow
  }

  skipOnboarding() {
    // TODO: Testing purpose
    this.navCtrl.setRoot(TabsPage);
    this.navCtrl.popToRoot();
  }

}
