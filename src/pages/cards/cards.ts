import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import * as _ from 'lodash';

// Providers
import { AppProvider } from '../../providers/app/app';
import { BitPayCardProvider } from '../../providers/bitpay-card/bitpay-card';
import { HomeIntegrationsProvider } from '../../providers/home-integrations/home-integrations';

// Pages
import { BitPayCardPage } from '../integrations/bitpay-card/bitpay-card';
import { BitPayCardIntroPage } from '../integrations/bitpay-card/bitpay-card-intro/bitpay-card-intro';

@Component({
  selector: 'page-cards',
  templateUrl: 'cards.html'
})
export class CardsPage {
  public homeIntegrations;
  public bitpayCardItems;
  public showBitPayCard: boolean = false;
  public hideHomeIntegrations: boolean;
  public showGiftCards: boolean;
  public showBitpayCardGetStarted: boolean;

  constructor(
    private appProvider: AppProvider,
    private homeIntegrationsProvider: HomeIntegrationsProvider,
    private bitPayCardProvider: BitPayCardProvider,
    private navCtrl: NavController
  ) {}

  ionViewDidEnter() {
    this.showGiftCards = this.homeIntegrationsProvider.shouldShowInHome(
      'giftcards'
    );

    this.showBitpayCardGetStarted = this.homeIntegrationsProvider.shouldShowInHome(
      'debitcard'
    );

    // Only BitPay Wallet
    this.bitPayCardProvider.get({ noHistory: true }).then(cards => {
      this.showBitPayCard = !!this.appProvider.info._enabledExtensions
        .debitcard;
      this.bitpayCardItems = cards;
    });
  }

  public goTo(page: string): void {
    const pageMap = {
      BitPayCardIntroPage
    };
    this.navCtrl.push(pageMap[page]);
  }

  public goToCard(cardId): void {
    this.navCtrl.push(BitPayCardPage, { id: cardId });
  }
}
