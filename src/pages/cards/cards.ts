import { Component } from '@angular/core';

// Providers
import { AppProvider } from '../../providers/app/app';
import { BitPayCardProvider } from '../../providers/bitpay-card/bitpay-card';
import { GiftCardProvider } from '../../providers/gift-card/gift-card';
import { HomeIntegrationsProvider } from '../../providers/home-integrations/home-integrations';
import { TabProvider } from '../../providers/tab/tab';

@Component({
  selector: 'page-cards',
  templateUrl: 'cards.html'
})
export class CardsPage {
  public bitpayCardItems;
  public showGiftCards: boolean;
  public showBitPayCard: boolean;
  public activeCards: any;
  public gotCardItems: boolean = false;

  constructor(
    private appProvider: AppProvider,
    private homeIntegrationsProvider: HomeIntegrationsProvider,
    private bitPayCardProvider: BitPayCardProvider,
    private giftCardProvider: GiftCardProvider,
    private tabProvider: TabProvider
  ) {}

  async ionViewDidEnter() {
    this.showGiftCards = this.homeIntegrationsProvider.shouldShowInHome(
      'giftcards'
    );
    this.showBitPayCard = !!this.appProvider.info._enabledExtensions.debitcard;
    await this.fetchAllCards();
  }

  private async fetchBitpayCardItems() {
    this.bitpayCardItems = await this.tabProvider.bitpayCardItemsPromise;
    this.gotCardItems = true;
    const updatedBitpayCardItemsPromise = this.bitPayCardProvider.get({
      noHistory: true
    });
    this.bitpayCardItems = await updatedBitpayCardItemsPromise;
    this.tabProvider.bitpayCardItemsPromise = updatedBitpayCardItemsPromise;
  }

  private async fetchActiveGiftCards() {
    this.activeCards = await this.tabProvider.activeGiftCardsPromise;
    const updatedActiveGiftCardsPromise = this.giftCardProvider.getActiveCards();
    this.activeCards = await updatedActiveGiftCardsPromise;
    this.tabProvider.activeGiftCardsPromise = updatedActiveGiftCardsPromise;
  }

  private async fetchAllCards() {
    return Promise.all([
      this.fetchBitpayCardItems(),
      this.fetchActiveGiftCards()
    ]);
  }
}
