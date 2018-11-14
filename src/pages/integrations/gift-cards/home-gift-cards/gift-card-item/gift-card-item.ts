import {
  Component,
  EventEmitter,
  Input,
  Output,
  Renderer,
  ViewChild
} from '@angular/core';
import { Item, ItemSliding } from 'ionic-angular';
import * as _ from 'lodash';

import { GiftCardProvider } from '../../../../../providers/gift-card/gift-card';
import {
  CardConfig,
  CardName,
  GiftCard
} from '../../../../../providers/gift-card/gift-card.types';

export type CardItemAction = 'archive' | 'view';

@Component({
  selector: 'gift-card-item',
  template: `
    <ion-item-sliding #slidingItem>
      <button ion-item (click)="performAction('view')">
        <img
          class="{{cardConfig?.brand.replace('.', '')}}"
          [src]="cardConfig?.logo"
        />
        <ion-note
          item-end
          [ngClass]="{ dark: cardConfig?.logoBackgroundColor === '#ffffff' }"
          *ngIf="shouldShowTotalBalance()"
        >
          {{ totalBalance | formatCurrency: currency }}
        </ion-note>
      </button>
      <ion-item-options side="right">
        <button ion-button (click)="performAction('archive')" color="danger">
          <div class="archive__icon">
            <ion-icon ios="md-close" md="md-close"></ion-icon>
          </div>
          <div class="archive__text">Archive?</div>
        </button>
      </ion-item-options>
    </ion-item-sliding>
  `
})
export class GiftCardItem {
  @Input()
  cardName: CardName;

  @Input()
  giftCards: GiftCard[] = [];

  @Output()
  action: EventEmitter<{
    cardName: CardName;
    action: CardItemAction;
  }> = new EventEmitter();

  currentCards: GiftCard[];
  cardConfig: CardConfig;
  currency: string;
  numCurrencies: number;
  totalBalance: number;

  @ViewChild(Item)
  item: Item;

  @ViewChild(ItemSliding)
  slidingItem: ItemSliding;

  constructor(
    private giftCardProvider: GiftCardProvider,
    private renderer: Renderer
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
    this.slidingItem.close();
  }

  shouldShowTotalBalance() {
    return this.cardConfig && this.numCurrencies === 1 && this.totalBalance;
  }

  private async setBrandStyling() {
    this.cardConfig = await this.giftCardProvider.getCardConfig(this.cardName);
    this.renderer.setElementStyle(
      this.item.getNativeElement(),
      'background-color',
      this.cardConfig.logoBackgroundColor
    );
  }
}

function getNumCurrencies(cards: GiftCard[]) {
  const currencies = cards.map(c => c.currency);
  const uniqueCurrencies = _.uniq(currencies);
  return uniqueCurrencies.length;
}
