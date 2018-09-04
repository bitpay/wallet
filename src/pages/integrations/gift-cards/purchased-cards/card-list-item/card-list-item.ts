import { Component, Input } from '@angular/core';
import {
  CardConifg,
  GiftCard,
  GiftCardProvider
} from '../../../../../providers/gift-card/gift-card';

@Component({
  selector: 'card-list-item',
  template: `
  <button ion-item class="card-list-item">
    <ion-icon item-start>
      <img class="card-list-item__icon" [src]="cardConfig?.icon">
    </ion-icon>
    <ion-label>
      <div class="card-list-item__label">{{card.amount | formatCurrency:card.currency}}</div>
      <ion-note class="card-list-item__note">{{card.date | amTimeAgo}}</ion-note>
    </ion-label>
  </button>
  `
})
export class CardListItemComponent {
  public cardConfig: CardConifg;

  @Input()
  card: GiftCard;

  constructor(private giftCardProvider: GiftCardProvider) {}

  async ngOnInit() {
    this.cardConfig = await this.giftCardProvider.getCardConfig(this.card.name);
  }
}
