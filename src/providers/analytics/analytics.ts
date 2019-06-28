import { Injectable } from '@angular/core';
import { CardConfig } from '../gift-card/gift-card.types';

@Injectable()
export class AnalyticsProvider {
  trackEvent(eventName: string, eventParams: { [key: string]: any }) {
    console.log(eventName, eventParams);
  }

  getDiscountEventParams(discountedCard: CardConfig, context?: string) {
    const discount = discountedCard.discounts[0];
    return {
      brand: discountedCard.name,
      code: discount.code,
      context,
      percentage: discount.amount
    };
  }
}
