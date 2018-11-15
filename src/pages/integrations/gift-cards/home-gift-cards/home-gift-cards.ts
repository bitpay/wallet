import {
  animate,
  query,
  style,
  transition,
  trigger
} from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { NavController } from 'ionic-angular';
import { debounceTime } from 'rxjs/operators';
import { ActionSheetProvider, AppProvider } from '../../../../providers';
import { GiftCardProvider } from '../../../../providers/gift-card/gift-card';
import {
  CardName,
  GiftCard
} from '../../../../providers/gift-card/gift-card.types';
import { CardCatalogPage } from '../card-catalog/card-catalog';
import { CardDetailsPage } from '../card-details/card-details';
import { PurchasedCardsPage } from '../purchased-cards/purchased-cards';
import { GiftCardItem } from './gift-card-item/gift-card-item';

@Component({
  selector: 'gift-cards',
  templateUrl: 'home-gift-cards.html',
  animations: [
    trigger('archiveAnimation', [
      transition(':leave', [
        style({
          opacity: 1
        }),
        animate(
          '400ms 0ms ease',
          style({
            opacity: 0,
            marginTop: '-88px',
            transform: 'translate3d(0, 88px, 0)'
          })
        )
      ])
    ]),
    trigger('preventInitialChildAnimations', [
      transition(':enter', [query(':enter', [], { optional: true })])
    ])
  ]
})
export class HomeGiftCards implements OnInit {
  public activeBrands: GiftCard[][];
  public appName: string;
  public disableArchiveAnimation: boolean = true; // Removes flicker on iOS when returning to home tab

  constructor(
    private actionSheetProvider: ActionSheetProvider,
    private appProvider: AppProvider,
    private giftCardProvider: GiftCardProvider,
    private navCtrl: NavController
  ) {}

  async ngOnInit() {
    this.appName = this.appProvider.info.userVisibleName;
    this.initGiftCards();
  }

  public buyGiftCards() {
    this.navCtrl.push(CardCatalogPage);
  }

  public onGiftCardAction(event, purchasedCards: GiftCard[]) {
    event.action === 'view'
      ? this.viewGiftCards(event.cardName, purchasedCards)
      : this.showArchiveSheet(event);
  }

  private async viewGiftCards(cardName: CardName, cards: GiftCard[]) {
    const activeCards = cards.filter(c => !c.archived);
    activeCards.length === 1
      ? this.navCtrl.push(CardDetailsPage, { card: activeCards[0] })
      : this.navCtrl.push(PurchasedCardsPage, { cardName });
  }

  private showArchiveSheet(event) {
    const brandCards = this.activeBrands
      .find(brandCards => brandCards[0].name === event.cardName)
      .filter(card => !card.archived);
    const sheetName =
      brandCards.length === 1 ? 'archive-gift-card' : 'archive-all-gift-cards';
    const archiveSheet = this.actionSheetProvider.createInfoSheet(sheetName, {
      brand: brandCards[0].brand
    });
    archiveSheet.present();
    archiveSheet.onDidDismiss(async confirm => {
      if (!confirm) return;
      await this.giftCardProvider.archiveAllCards(event.cardName);
    });
  }

  private async hideArchivedBrands() {
    this.disableArchiveAnimation = false;
    const purchasedBrands = await this.giftCardProvider.getPurchasedBrands();
    const { activeCardNames } = await this.getActiveGiftCards(purchasedBrands);
    const filteredBrands = this.activeBrands.filter(
      cards => activeCardNames.indexOf(cards[0].name) > -1
    );
    filteredBrands.length === this.activeBrands.length
      ? this.loadGiftCards()
      : (this.activeBrands = filteredBrands);
  }

  private async initGiftCards() {
    this.loadGiftCards();
    this.giftCardProvider.cardUpdates$
      .pipe(debounceTime(300))
      .subscribe(card => {
        card.archived ? this.hideArchivedBrands() : this.loadGiftCards();
      });
  }

  private getActiveGiftCards(purchasedBrands: GiftCard[][]) {
    const activeCards = purchasedBrands.filter(
      cards => cards.filter(c => !c.archived).length
    );
    const activeCardNames = activeCards.map(cards => cards[0].name);
    return { activeCards, activeCardNames };
  }

  private updatePendingGiftCards(purchasedBrands: GiftCard[][]) {
    const allCards = purchasedBrands.reduce(
      (allCards, brandCards) => [...allCards, ...brandCards],
      []
    );
    this.giftCardProvider.updatePendingGiftCards(allCards);
  }

  private async loadGiftCards() {
    this.disableArchiveAnimation = true;
    const purchasedBrands = await this.giftCardProvider.getPurchasedBrands();
    const { activeCards } = this.getActiveGiftCards(purchasedBrands);
    this.updatePendingGiftCards(purchasedBrands);
    this.activeBrands = activeCards;
  }
}

export const HOME_GIFT_CARD_COMPONENTS = [HomeGiftCards, GiftCardItem];
