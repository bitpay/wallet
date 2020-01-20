import { Component } from '@angular/core';

// Providers
import { AppProvider } from '../../providers/app/app';
import { BitPayCardProvider } from '../../providers/bitpay-card/bitpay-card';
import { GiftCardProvider } from '../../providers/gift-card/gift-card';
import { HomeIntegrationsProvider } from '../../providers/home-integrations/home-integrations';

@Component({
  selector: 'page-cards',
  templateUrl: 'cards.html'
})
export class CardsPage {
  public bitpayCardItems;
  public showGiftCards: boolean;
  public showBitPayCard: boolean;
  public activeCards: any;

  constructor(
    private appProvider: AppProvider,
    private homeIntegrationsProvider: HomeIntegrationsProvider,
    private bitPayCardProvider: BitPayCardProvider,
    private giftCardProvider: GiftCardProvider
  ) {}

  async ionViewDidEnter() {
    this.showGiftCards = this.homeIntegrationsProvider.shouldShowInHome(
      'giftcards'
    );
    this.showBitPayCard = !!this.appProvider.info._enabledExtensions.debitcard;
    this.bitpayCardItems = await this.bitPayCardProvider.get({
      noHistory: true
    });
    this.activeCards = await this.giftCardProvider.getActiveCards();
  }
}
