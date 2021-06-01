import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

// pages
import { WalletsPage } from '../../wallets/wallets';
@Component({
  selector: 'page-lotus-donation-card',
  templateUrl: 'lotus-donation-card.html'
})
export class LotusDonationCard {

  constructor(
    private navCtrl: NavController,
  ) {}

  public donationLotus() {
    this.navCtrl.push(WalletsPage, {
      isDonation: true
    });
  }
}
