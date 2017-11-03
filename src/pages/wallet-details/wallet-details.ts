import { Component } from '@angular/core';
import { NavParams } from 'ionic-angular';

@Component({
  selector: 'page-wallet-details',
  templateUrl: 'wallet-details.html'
})
export class WalletDetailsPage {
  public wallet: any;

  constructor(
    private navParams: NavParams,
  ) {
    this.wallet = this.navParams.data.wallet;
  }

  ionViewDidEnter() {}
}