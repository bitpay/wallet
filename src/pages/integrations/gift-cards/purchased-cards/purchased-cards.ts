import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

import { ActionSheetProvider } from '../../../../providers';
import { GiftCardProvider } from '../../../../providers/gift-card/gift-card';
import {
  CardConfig,
  GiftCard
} from '../../../../providers/gift-card/gift-card.types';
import { Logger } from '../../../../providers/logger/logger';
import { BuyCardPage } from '../buy-card/buy-card';
import { CardDetailsPage } from '../card-details/card-details';
import { CardListItemComponent } from './card-list-item/card-list-item';

@Component({
  selector: 'purchased-cards-page',
  templateUrl: 'purchased-cards.html'
})
export class PurchasedCardsPage {
  public allGiftCards: GiftCard[];
  public currentGiftCards: GiftCard[];
  public archivedGiftCards: GiftCard[];
  public cardConfig: CardConfig;

  constructor(
    protected actionSheetProvider: ActionSheetProvider,
    protected giftCardProvider: GiftCardProvider,
    protected logger: Logger,
    protected navCtrl: NavController,
    protected navParams: NavParams
  ) {}

  async ngOnInit() {
    const cardName = this.navParams.get('cardName');
    this.cardConfig = await this.giftCardProvider.getCardConfig(cardName);
    await this.getCards();
    this.listenForUpdates();
  }

  async ionViewDidLoad() {
    this.logger.info('Loaded: PurchasedCardsPage');
  }

  listenForUpdates() {
    this.giftCardProvider.cardUpdates$.subscribe(card => this.updateCard(card));
  }

  updateCard(card: GiftCard) {
    this.allGiftCards = this.allGiftCards.map(oldCard =>
      oldCard.invoiceId === card.invoiceId ? card : oldCard
    );
    this.setGiftCards(this.allGiftCards);
  }
  async addCard() {
    this.navCtrl.push(BuyCardPage, { cardConfig: this.cardConfig });
  }
  async archive() {
    const archiveSheet = this.actionSheetProvider.createInfoSheet(
      'archive-all-gift-cards',
      { brand: this.cardConfig.displayName }
    );
    archiveSheet.present();
    archiveSheet.onDidDismiss(async confirm => {
      if (!confirm) return;
      await this.navCtrl.pop();
      this.giftCardProvider.archiveAllCards(this.cardConfig.name);
    });
  }

  protected async getCards(): Promise<any> {
    await this.giftCardProvider
      .getPurchasedCards(this.cardConfig.name)
      .then(cards => this.setGiftCards(cards))
      .catch(err => this.logger.error(err));
    this.giftCardProvider.updatePendingGiftCards(this.currentGiftCards);
  }

  setGiftCards(allCards: GiftCard[]) {
    this.allGiftCards = allCards;
    this.currentGiftCards = allCards.filter(gc => !gc.archived);
    this.archivedGiftCards = allCards.filter(gc => gc.archived);
  }

  public async goToCardDetails(card) {
    await this.navCtrl.push(CardDetailsPage, { card });
    this.currentGiftCards.length === 1 && this.removePageFromHistory();
  }

  protected removePageFromHistory() {
    const startIndex = this.navCtrl.getActive().index - 1;
    this.navCtrl.remove(startIndex, 1);
  }
}

export const PURCHASED_CARDS_PAGE_COMPONENTS = [
  PurchasedCardsPage,
  CardListItemComponent
];
