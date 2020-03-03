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
      <span *ngIf="shouldShowConcisePercentage(discount)"
        >{{ math.floor(discount.amount) }}%</span
      >
      <span *ngIf="!shouldShowConcisePercentage(discount)"
        >{{ discount.amount }}%</span
      >
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

  shouldShowConcisePercentage(discount) {
    return this.showConcisePercentage && discount.amount >= 1;
  }
}
