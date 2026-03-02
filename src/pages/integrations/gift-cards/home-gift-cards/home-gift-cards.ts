import {
  animate,
  query,
  style,
  transition,
  trigger
} from '@angular/animations';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Content, ItemSliding, NavController } from 'ionic-angular';
import { timer } from 'rxjs/observable/timer';
import { debounceTime } from 'rxjs/operators';
import {
  ActionSheetProvider,
  AppProvider,
  ExternalLinkProvider,
  PersistenceProvider,
  PlatformProvider
} from '../../../../providers';
import {
  GiftCardProvider,
  sortByDisplayName
} from '../../../../providers/gift-card/gift-card';
import {
  CardConfig,
  GiftCard
} from '../../../../providers/gift-card/gift-card.types';
import { BuyCardPage } from '../buy-card/buy-card';
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
    ]),
    trigger('fade', [
      transition(':enter', [
        style({
          transform: 'translateY(5px)',
          opacity: 0
        }),
        animate('200ms')
      ])
    ])
  ]
})
export class HomeGiftCards implements OnInit {
  public activeBrands: GiftCard[][];
  public appName: string;
  public hideDiscount: boolean = false;
  public primaryCatalogCurrency: string = 'usd';
  public disableArchiveAnimation: boolean = true; // Removes flicker on iOS when returning to home tab

  @Input() activeCards: GiftCard[];

  @Input('scrollArea')
  scrollArea: Content;
  ready: boolean;
  @ViewChild(ItemSliding)
  slidingItem: ItemSliding;

  constructor(
    private actionSheetProvider: ActionSheetProvider,
    private appProvider: AppProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private giftCardProvider: GiftCardProvider,
    private navCtrl: NavController,
    private persistenceProvider: PersistenceProvider,
    public platformProvider: PlatformProvider
  ) {}

  async ngOnInit() {
    this.appName = this.appProvider.info.userVisibleName;
    await this.initGiftCards();
    setTimeout(() => {
      this.ready = true;
    }, 50);
    const availableCards = await this.giftCardProvider.getAvailableCards();
    this.primaryCatalogCurrency = getPrimaryCatalogCurrency(availableCards);
    this.hideDiscount = await this.persistenceProvider.getHideGiftCardDiscountItem();
    await timer(3000).toPromise();
    this.giftCardProvider.preloadImages();
  }

  public buyGiftCards() {
    this.navCtrl.push(CardCatalogPage, { giftCardsOnly: true });
  }

  public async buyCard(cardName: string) {
    const cardConfig = await this.giftCardProvider.getCardConfig(cardName);
    this.navCtrl.push(BuyCardPage, { cardConfig });
  }

  public onGiftCardAction(event, purchasedCards: GiftCard[]) {
    event.action === 'view'
      ? this.viewGiftCards(event.cardName, purchasedCards)
      : this.showArchiveSheet(event);
  }

  public launchExtension() {
    this.externalLinkProvider.open(
      'https://bitpay.com/extension/?launchExtension=true'
    );
  }

  private async viewGiftCards(cardName: string, cards: GiftCard[]) {
    const activeCards = cards.filter(c => !c.archived);
    activeCards.length === 1
      ? this.navCtrl.push(CardDetailsPage, { card: activeCards[0] })
      : this.navCtrl.push(PurchasedCardsPage, { cardName });
  }

  private async showArchiveSheet(event) {
    const brandCards = this.activeBrands
      .find(brandCards => brandCards[0].name === event.cardName)
      .filter(card => !card.archived);
    const sheetName =
      brandCards.length === 1 ? 'archive-gift-card' : 'archive-all-gift-cards';
    const cardConfig = await this.giftCardProvider.getCardConfig(
      brandCards[0].name
    );
    const archiveSheet = this.actionSheetProvider.createInfoSheet(sheetName, {
      brand: cardConfig.displayName
    });
    archiveSheet.present();
    archiveSheet.onDidDismiss(async confirm => {
      if (!confirm) return;
      await this.giftCardProvider.archiveAllCards(event.cardName);
    });
  }

  public async showHideDiscountItemSheet() {
    this.slidingItem.close();
    const hideDiscountSheet = this.actionSheetProvider.createInfoSheet(
      'hide-gift-card-discount-item'
    );
    hideDiscountSheet.present();
    hideDiscountSheet.onDidDismiss(async confirm => {
      if (!confirm) return;
      this.disableArchiveAnimation = false;
      this.hideDiscount = true;
      await this.giftCardProvider.hideDiscountItem();
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
    this.loadGiftCards(true);
    this.giftCardProvider.cardUpdates$
      .pipe(debounceTime(300))
      .subscribe(card =>
        card.archived ? this.hideArchivedBrands() : this.loadGiftCards()
      );
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

  private async loadGiftCards(isInitialLoad: boolean = false) {
    this.disableArchiveAnimation = true;
    const activeCards = isInitialLoad
      ? this.activeCards
      : await this.giftCardProvider.getActiveCards();
    const activeBrands = this.groupCardsByBrand(activeCards);
    this.updatePendingGiftCards(activeBrands);
    this.activeBrands = activeBrands;
  }

  private groupCardsByBrand(cards: GiftCard[]): GiftCard[][] {
    return cards
      .reduce((brands, c) => {
        const brandCards = brands.find(b => b[0].name === c.name);
        brandCards ? brandCards.push(c) : brands.push([c]);
        return brands;
      }, [] as GiftCard[][])
      .sort((a, b) => sortByDisplayName(a[0], b[0]));
  }
}

export function getPrimaryCatalogCurrency(availableCards: CardConfig[]) {
  const homeLogoCollageSupportedCurrencies = ['cad', 'eur', 'gbp', 'usd'];
  const firstBrandCurrency =
    availableCards[0] && availableCards[0].currency.toLowerCase();
  return homeLogoCollageSupportedCurrencies.indexOf(firstBrandCurrency) > -1
    ? firstBrandCurrency
    : 'usd';
}

export const HOME_GIFT_CARD_COMPONENTS = [HomeGiftCards, GiftCardItem];
