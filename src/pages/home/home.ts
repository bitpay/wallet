import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { AddPage } from "../add/add";
import { ProfileProvider } from '../../providers/profile/profile';
import { ReleaseProvider } from '../../providers/release/release';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  public wallets;

  constructor(
    public navCtrl: NavController,
    private profile: ProfileProvider,
    private release: ReleaseProvider,
  ) {
    this.release.getLatestAppVersion()
      .catch((err) => {
        console.log('Error:', err)
      })
      .then((version) => {
        console.log('Current app version:', version);
        var result = this.release.checkForUpdates(version);
        console.log('Update available:', result.updateAvailable);
      });
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad HomePage');

    this.wallets = this.profile.getWallets();
    console.log('[home.ts:20]', this.wallets); //TODO
  }

  goToAddView() {
    this.navCtrl.push(AddPage);
  }
}
