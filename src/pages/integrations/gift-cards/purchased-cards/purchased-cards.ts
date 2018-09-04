import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

// Providers
import { ExternalLinkProvider } from '../../../../providers/external-link/external-link';
import {
  CardConifg,
  GiftCard,
  GiftCardProvider
} from '../../../../providers/gift-card/gift-card';
import { Logger } from '../../../../providers/logger/logger';
import { BuyCardPage } from '../buy-card/buy-card';
import { CardDetailsPage } from '../card-details/card-details';
import { CardListItemComponent } from './card-list-item/card-list-item';

@Component({
  selector: 'purchased-cards-page',
  templateUrl: 'purchased-cards.html'
})
export class PurchasedCardsPage {
  public network: string;
  public giftCards: { [invoiceId: string]: GiftCard };
  public allGiftCards: GiftCard[];
  public currentGiftCards: GiftCard[];
  public archivedGiftCards: GiftCard[];
  public updatingPending;
  public card;
  public invoiceId: string;
  public platformName: 'ios' | 'md' = 'md';
  public cardConfig: CardConifg;

  constructor(
    private externalLinkProvider: ExternalLinkProvider,
    private giftCardProvider: GiftCardProvider,
    private logger: Logger,
    private navCtrl: NavController,
    private navParams: NavParams
  ) {}

  async ngOnInit() {
    const cardName = this.navParams.get('cardName');
    this.cardConfig = await this.giftCardProvider.getCardConfig(cardName);
    await this.getCards();
    this.listenForUpdates();
  }

  async ionViewDidLoad() {
    this.logger.info('ionViewDidLoad PurchasedCardsPage');
  }

  listenForUpdates() {
    this.giftCardProvider.cardUpdates$.subscribe(card => this.updateCard(card));
  }

  updateCard(card: GiftCard) {
    this.allGiftCards = this.allGiftCards.map(
      oldCard => (oldCard.invoiceId === card.invoiceId ? card : oldCard)
    );
    this.setGiftCards(this.allGiftCards);
  }

  addCard() {
    this.navCtrl.push(BuyCardPage, { cardName: this.cardConfig.name });
  }

  private async getCards(): Promise<any> {
    await this.giftCardProvider
      .getPurchasedCards(this.cardConfig.name)
      .then(cards => this.setGiftCards(cards))
      .catch(err => this.logger.error(err));
    this.updatePendingCards(this.currentGiftCards);
  }

  setGiftCards(allCards: GiftCard[]) {
    this.allGiftCards = allCards;
    this.currentGiftCards = allCards.filter(gc => !gc.archived);
    this.archivedGiftCards = allCards.filter(gc => gc.archived);
  }

  public updatePendingCards(cards: GiftCard[]) {
    this.giftCardProvider
      .updatePendingGiftCards(cards)
      .subscribe(card => this.updateCard(card));
  }

  public openExternalLink(url: string) {
    this.externalLinkProvider.open(url);
  }

  public goToCardDetails(card) {
    return this.navCtrl.push(CardDetailsPage, { card });
  }
}

export const PURCHASED_CARDS_PAGE_COMPONENTS = [
  PurchasedCardsPage,
  CardListItemComponent
];
