import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

import { TourPage } from './tour/tour';
import { TabsPage } from '../tabs/tabs';

@Component({
  selector: 'page-onboarding',
  templateUrl: 'onboarding.html',
})
export class OnboardingPage {

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams
  ) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad OnboardingPage');
  }

  createProfile() {
    // TODO: create a new profile
  }

  getStarted() {
    this.navCtrl.push(TourPage);
  }

  restoreFromBackup() {
    // TODO navigate to backupFlow
  }

  // TODO: Testing purpose
  skipOnboarding() {
    this.navCtrl.setRoot(TabsPage);
    this.navCtrl.popToRoot();
  }

}
