import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { ExternalLinkProvider } from '../../../providers';

// pages
import { WalletsPage } from '../../wallets/wallets';
@Component({
  selector: 'page-lotus-donation-card',
  templateUrl: 'lotus-donation-card.html'
})
export class LotusDonationCard {

  constructor(
    private navCtrl: NavController,
    private externalLinkProvider: ExternalLinkProvider
  ) {}

  public donationLotus() {
    this.navCtrl.push(WalletsPage, {
      isDonation: true
    });
  }

  public openLink(url) {
    this.externalLinkProvider.open(url);
  }
}
