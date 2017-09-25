import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { ProfileProvider } from '../../providers/profile/profile';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  public wallets;

  constructor(
    public navCtrl: NavController,
    private profile: ProfileProvider
  ) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad HomePage');
    this.wallets = this.profile.bind();
    console.log('[home.ts:20]', this.wallets); //TODO
  }
}
