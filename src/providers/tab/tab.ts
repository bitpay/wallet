import { Injectable } from '@angular/core';
import { BitPayCardProvider } from '../bitpay-card/bitpay-card';
import { GiftCardProvider } from '../gift-card/gift-card';
import { GiftCard } from '../gift-card/gift-card.types';

@Injectable()
export class TabProvider {
  bitpayCardItemsPromise: Promise<any>;
  activeGiftCardsPromise: Promise<GiftCard[]>;

  constructor(
    private bitPayCardProvider: BitPayCardProvider,
    private giftCardProvider: GiftCardProvider
  ) {}

  prefetchBitpayCardItems(): Promise<any> {
    this.bitpayCardItemsPromise = this.bitPayCardProvider.get({
      noHistory: true
    });
    return this.bitpayCardItemsPromise;
  }

  prefetchGiftCards(): Promise<GiftCard[]> {
    this.activeGiftCardsPromise = this.giftCardProvider.getActiveCards();
    return this.activeGiftCardsPromise;
  }

  prefetchCards(): Promise<[any, GiftCard[]]> {
    return Promise.all([
      this.prefetchBitpayCardItems(),
      this.prefetchGiftCards()
    ]);
  }
}
