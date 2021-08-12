import { Injectable } from '@angular/core';
import { GiftCard } from '../gift-card/gift-card.types';

@Injectable()
export class TabProvider {
  activeGiftCardsPromise: Promise<GiftCard[]>;
}
