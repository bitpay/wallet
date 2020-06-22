import { Component, Input } from '@angular/core';
import { ThemeProvider } from '../../../../../providers';
import { GiftCardProvider } from '../../../../../providers/gift-card/gift-card';
import {
  CardConfig,
  GiftCard
} from '../../../../../providers/gift-card/gift-card.types';
import {
  getDiscount,
  getDiscountTextColor,
  Merchant
} from '../../../../../providers/merchant/merchant';

@Component({
  selector: 'card-list-item',
  template: `
    <button ion-item class="card-list-item">
      <ion-icon item-start>
        <img-loader
          *ngIf="!merchant || !merchant.hasDirectIntegration"
          class="card-list-item__icon"
          [ngClass]="{ archived: card?.archived && type === 'purchased' }"
          [src]="icon"
          [fallbackAsPlaceholder]="true"
          [fallbackUrl]="giftCardProvider.fallbackIcon"
        ></img-loader>
        <div
          *ngIf="merchant && merchant.hasDirectIntegration"
          class="card-list-item__icon"
        >
          <img [src]="icon" />
        </div>
      </ion-icon>
      <ion-label>
        <div
          class="card-list-item__label ellipsis"
          *ngIf="type !== 'purchased'"
        >
          {{ displayName }}
        </div>
        <div *ngIf="type === 'purchased'">
          <div class="card-list-item__label">
            {{ card.amount | formatCurrency: card.currency }}
          </div>
          <ion-note class="card-list-item__note">{{
            card.date | amTimeAgo
          }}</ion-note>
        </div>
        <div *ngIf="type === 'catalog' && (cardConfig || merchant)">
          <div *ngIf="discount">
            <ion-note
              class="card-list-item__note discount ellipsis"
              [ngStyle]="{ color: discountTextColor }"
            >
              <gift-card-discount-text
                [cardConfig]="cardConfig"
                [merchant]="merchant"
                [discount]="discount"
              >
              </gift-card-discount-text>
            </ion-note>
          </div>
          <div *ngIf="!discount">
            <ion-note class="card-list-item__note ellipsis" *ngIf="!cardConfig">
              {{ merchant.caption }}
            </ion-note>
            <ion-note
              class="card-list-item__note"
              *ngIf="cardConfig && !cardConfig.supportedAmounts"
            >
              {{ cardConfig.minAmount | formatCurrency: currency:0 }} —
              {{ cardConfig.maxAmount | formatCurrency: currency:0 }}
            </ion-note>
            <ion-note
              class="card-list-item__note ellipsis"
              *ngIf="cardConfig && cardConfig.supportedAmounts"
            >
              <span
                *ngFor="
                  let amount of cardConfig.supportedAmounts;
                  let last = last
                "
              >
                {{ amount | formatCurrency: currency:'minimal'
                }}<span *ngIf="!last">,</span>
              </span>
            </ion-note>
          </div>
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
  type: 'catalog' | 'purchased' | 'settings' = 'catalog';

  @Input()
  config: CardConfig;

  @Input()
  merchant: Merchant;

  currency: string;
  displayName: string;
  discountTextColor: string;
  icon: string;

  discount;

  constructor(
    public giftCardProvider: GiftCardProvider,
    public themeProvider: ThemeProvider
  ) {}

  async ngOnInit() {
    this.cardConfig =
      this.config ||
      (this.merchant && this.merchant.giftCards[0]) ||
      (this.card &&
        (await this.giftCardProvider.getCardConfig(this.card.name)));
    this.currency =
      (this.card && this.card.currency) ||
      (this.cardConfig && this.cardConfig.currency);
    this.displayName = this.merchant
      ? this.merchant.displayName
      : this.cardConfig.displayName;
    this.discount = this.merchant && getDiscount(this.merchant);
    this.discountTextColor =
      this.merchant &&
      getDiscountTextColor(
        this.merchant,
        this.themeProvider.getCurrentAppTheme()
      );
    this.icon =
      (this.cardConfig && this.cardConfig.icon) ||
      (this.merchant && this.merchant.icon);
  }
}
