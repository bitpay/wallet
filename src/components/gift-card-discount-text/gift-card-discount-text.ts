import { Component, Input } from '@angular/core';
import {
  CardConfig,
  GiftCardDiscount
} from '../../providers/gift-card/gift-card.types';
import { Merchant } from '../../providers/merchant/merchant';

@Component({
  selector: 'gift-card-discount-text',
  template: `
    <span *ngIf="discount.type === 'flatrate'">{{
      discount.amount | formatCurrency: currency:'minimal'
    }}</span>
    <span *ngIf="discount.type === 'percentage'">
      <span *ngIf="shouldShowConcisePercentage(discount)"
        >{{ math.floor(discount.amount) }}%</span
      >
      <span *ngIf="!shouldShowConcisePercentage(discount)"
        >{{ discount.amount }}%</span
      >
    </span>
    <span
      *ngIf="!numberOnly && ['flatrate', 'percentage'].includes(discount.type)"
      >Off Every Purchase</span
    >
    <span *ngIf="discount.type === 'custom'">{{
      discount.value || 'Discount Available'
    }}</span>
  `
})
export class GiftCardDiscountText {
  @Input()
  discount: GiftCardDiscount;

  @Input()
  cardConfig: CardConfig;

  @Input()
  merchant: Merchant;

  @Input()
  showConcisePercentage: boolean = false;

  @Input()
  numberOnly: boolean = false;

  currency: string;

  math = Math;

  constructor() {}

  ngOnInit() {
    const cardConfig =
      (this.merchant &&
        this.merchant.giftCards[0] &&
        this.merchant.giftCards[0]) ||
      this.cardConfig;
    this.currency =
      this.discount.currency || (cardConfig && cardConfig.currency);
  }

  shouldShowConcisePercentage(discount) {
    return this.showConcisePercentage && discount.amount >= 1;
  }
}
