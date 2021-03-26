import { Injectable } from '@angular/core';
import { GiftCardProvider } from '../gift-card/gift-card';
import { GiftCard } from '../gift-card/gift-card.types';

@Injectable()
export class TabProvider {
  activeGiftCardsPromise: Promise<GiftCard[]>;

  constructor(private giftCardProvider: GiftCardProvider) {}

  prefetchGiftCards(): Promise<GiftCard[]> {
    this.activeGiftCardsPromise = this.giftCardProvider.getActiveCards();
    return this.activeGiftCardsPromise;
  }
}
