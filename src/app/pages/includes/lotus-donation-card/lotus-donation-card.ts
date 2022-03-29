import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AppProvider } from 'src/app/providers';
import { ExternalLinkProvider } from 'src/app/providers/external-link/external-link';

@Component({
  selector: 'page-lotus-donation-card',
  templateUrl: 'lotus-donation-card.html',
  styleUrls: ['lotus-donation-card.scss']
})
export class LotusDonationCard {
  currentTheme;

  constructor(
    private appProvider: AppProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private router: Router
  ) {
    this.currentTheme = this.appProvider.themeProvider.currentAppTheme;
  }

  public donationLotus() {
    this.router.navigateByUrl('/accounts-page', {
      state: {
        isDonation: true
      }
    });
  }

  public openLink(url) {
    this.externalLinkProvider.open(url);
  }
}
