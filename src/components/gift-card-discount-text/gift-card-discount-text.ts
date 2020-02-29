import { Component, Input } from '@angular/core';
import {
  CardConfig,
  GiftCardDiscount
} from '../../providers/gift-card/gift-card.types';

@Component({
  selector: 'gift-card-discount-text',
  template: `
    <span *ngIf="discount.type === 'flatrate'">{{
      discount.amount | formatCurrency: cardConfig.currency:'minimal'
    }}</span>
    <span *ngIf="discount.type === 'percentage'">
      <span *ngIf="showConcisePercentage"
        >{{ math.floor(discount.amount) }}%</span
      >
      <span *ngIf="!showConcisePercentage">{{ discount.amount }}%</span>
    </span>
  `
})
export class GiftCardDiscountText {
  @Input()
  discount: GiftCardDiscount;

  @Input()
  cardConfig: CardConfig;

  @Input()
  showConcisePercentage: boolean = false;

  math = Math;

  constructor() {}
}
