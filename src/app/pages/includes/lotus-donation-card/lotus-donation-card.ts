import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ExternalLinkProvider } from 'src/app/providers/external-link/external-link';

@Component({
  selector: 'page-lotus-donation-card',
  templateUrl: 'lotus-donation-card.html',
  styleUrls: ['lotus-donation-card.scss']
})
export class LotusDonationCard {

  constructor(
    private externalLinkProvider: ExternalLinkProvider,
    private router: Router
  ) {}

  public donationLotus() {
    this.router.navigateByUrl('/tabs/wallets', {
      state: {
        isDonation: true
      }
    });
  }

  public openLink(url) {
    this.externalLinkProvider.open(url);
  }
}
