import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { AddPage } from "../add/add";
import { ProfileProvider } from '../../providers/profile/profile';
import { LatestReleaseProvider } from '../../providers/latestRelease/latestRelease';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  public wallets;

  constructor(
    public navCtrl: NavController,
    private profile: ProfileProvider,
    private latestRelease: LatestReleaseProvider,
  ) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad HomePage');

    this.wallets = this.profile.bind();
    this.latestRelease.checkLatestRelease().then((response) => {
      console.log('New release available: ', response);
    }).catch((error) => {
      console.log('Latest Release error: ', error);
    });
    console.log('[home.ts:20]', this.wallets); //TODO
  }

  goToAddView() {
    this.navCtrl.push(AddPage);
  }
}
