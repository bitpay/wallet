import { Component, Input } from '@angular/core';
import { GiftCardProvider } from '../../../../../providers/gift-card/gift-card';
import {
  CardConfig,
  GiftCard
} from '../../../../../providers/gift-card/gift-card.types';

@Component({
  selector: 'card-list-item',
  template: `
  <button ion-item class="card-list-item">
    <ion-icon item-start>
      <img class="card-list-item__icon" [ngClass]="{archived: card?.archived && !catalogListing}" [src]="cardConfig?.icon">
    </ion-icon>
    <ion-label>
      <div *ngIf="!catalogListing">
        <div class="card-list-item__label">{{card.amount | formatCurrency:card.currency}}</div>
        <ion-note class="card-list-item__note">{{card.date | amTimeAgo}}</ion-note>
      </div>
      <div *ngIf="catalogListing && cardConfig">
        <div class="card-list-item__label">{{cardConfig.brand}}</div>
        <ion-note class="card-list-item__note" *ngIf="!cardConfig.supportedAmounts">
          {{cardConfig.minAmount | formatCurrency:currency:0}} — {{cardConfig.maxAmount | formatCurrency:currency:0}}
        </ion-note>
        <ion-note class="card-list-item__note" *ngIf="cardConfig.supportedAmounts">
          <span *ngFor="let amount of cardConfig.supportedAmounts; let last = last">
            {{amount | formatCurrency:currency:0}}<span *ngIf="!last">,</span>
          </span>
        </ion-note>
      </div>
    </ion-label>
  </button>
  `
})
export class CardListItemComponent {
  public cardConfig: CardConfig;

  @Input()
  card: GiftCard;

  @Input()
  catalogListing: boolean = false;

  currency: string;

  constructor(private giftCardProvider: GiftCardProvider) {}

  async ngOnInit() {
    this.cardConfig = await this.giftCardProvider.getCardConfig(this.card.name);
    this.currency =
      (this.card && this.card.currency) || this.cardConfig.currency;
  }
}
