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
      <ion-note class="assertive" *ngIf="card.status == 'FAILURE' || card.status == 'RESEND'" translate>Error</ion-note>
      <ion-note class="assertive" *ngIf="card.status == 'expired'" translate>Expired</ion-note>
      <ion-note class="assertive" *ngIf="card.status == 'invalid'" translate>Still waiting confirmation (Use higher fees setting to faster delivery)</ion-note>
      <ion-note class="text-gray" *ngIf="card.status == 'PENDING'" translate>Pending to confirmation</ion-note>
      <ion-note class="assertive" *ngIf="card.status == 'SUCCESS' && card.cardStatus == 'Canceled'" translate>Canceled</ion-note>
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
