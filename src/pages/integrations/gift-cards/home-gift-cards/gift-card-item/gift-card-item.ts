import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  Renderer2,
  ViewChild
} from '@angular/core';
import * as _ from 'lodash';

import { GiftCardProvider } from '../../../../../providers/gift-card/gift-card';
import {
  CardConfig,
  GiftCard
} from '../../../../../providers/gift-card/gift-card.types';

export type CardItemAction = 'archive' | 'view';

@Component({
  selector: 'gift-card-item',
  templateUrl: 'gift-card-item.html'
})
export class GiftCardItem {
  @Input()
  cardName: string;

  @Input()
  giftCards: GiftCard[] = [];

  @Output()
  action: EventEmitter<{
    cardName: string;
    action: CardItemAction;
  }> = new EventEmitter();

  currentCards: GiftCard[];
  cardConfig: CardConfig;
  currency: string;
  numCurrencies: number;
  totalBalance: number;

  @ViewChild('card')
  card: ElementRef;

  constructor(
    private giftCardProvider: GiftCardProvider,
    private renderer: Renderer2
  ) {}

  async ngAfterViewInit() {
    this.cardName && this.setBrandStyling();
    this.currentCards = this.giftCards.filter(g => !g.archived);
    this.currency = this.currentCards[0].currency;
    this.numCurrencies = getNumCurrencies(this.currentCards);
    this.totalBalance = this.currentCards.reduce(
      (sum, card) => sum + card.amount,
      0
    );
  }

  performAction(action: CardItemAction) {
    this.action.emit({
      cardName: this.cardName,
      action
    });
  }

  shouldShowTotalBalance() {
    return this.cardConfig && this.numCurrencies === 1 && this.totalBalance;
  }

  private async setBrandStyling() {
    this.cardConfig = await this.giftCardProvider.getCardConfig(this.cardName);
    const isGradient =
      this.cardConfig.logoBackgroundColor.indexOf('gradient') > -1;
    const cssProperty = isGradient ? 'background-image' : 'background-color';
    this.renderer.setStyle(
      this.card.nativeElement,
      cssProperty,
      this.cardConfig.logoBackgroundColor
    );
  }
}

function getNumCurrencies(cards: GiftCard[]) {
  const currencies = cards.map(c => c.currency);
  const uniqueCurrencies = _.uniq(currencies);
  return uniqueCurrencies.length;
}
