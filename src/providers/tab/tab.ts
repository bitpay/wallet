import { Injectable } from '@angular/core';
import { Events } from 'ionic-angular';
import {
  GiftCardProvider,
  hasPromotion,
  hasVisibleDiscount
} from '../gift-card/gift-card';
import { GiftCard } from '../gift-card/gift-card.types';

@Injectable()
export class TabProvider {
  bitpayCardItemsPromise: Promise<any>;
  activeGiftCardsPromise: Promise<GiftCard[]>;

  constructor(
    private events: Events,
    private giftCardProvider: GiftCardProvider
  ) {}

  prefetchGiftCards(): Promise<GiftCard[]> {
    this.activeGiftCardsPromise = this.giftCardProvider.getActiveCards();
    return this.activeGiftCardsPromise;
  }

  async fetchGiftCardAdvertisement() {
    const availableCards = await this.giftCardProvider.getAvailableCards();
    const discountedCard = availableCards.find(cardConfig =>
      hasVisibleDiscount(cardConfig)
    );
    const promotedCard = availableCards.find(card => hasPromotion(card));
    if (discountedCard) {
      this.events.publish('Local/GiftCardDiscount', discountedCard);
    } else if (promotedCard) {
      this.events.publish('Local/GiftCardPromotion', promotedCard);
    }
  }
}
