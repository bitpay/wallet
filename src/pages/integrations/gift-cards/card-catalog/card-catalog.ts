import { Component, OnInit, ViewChild } from '@angular/core';
import { NavController } from 'ionic-angular';

import { BuyCardPage } from '../buy-card/buy-card';

import { ActionSheetProvider } from '../../../../providers';
import { GiftCardProvider } from '../../../../providers/gift-card/gift-card';
import { CardConfig } from '../../../../providers/gift-card/gift-card.types';
import { WideHeaderPage } from '../../../templates/wide-header-page/wide-header-page';

@Component({
  selector: 'card-catalog-page',
  templateUrl: 'card-catalog.html'
})
export class CardCatalogPage implements OnInit {
  public allCards: CardConfig[];
  public featuredCards: CardConfig[];
  public moreCards: CardConfig[];
  public searchQuery: string = '';
  public numFeaturedCards: number;
  public numMoreCards: number;

  @ViewChild(WideHeaderPage)
  wideHeaderPage: WideHeaderPage;

  constructor(
    private actionSheetProvider: ActionSheetProvider,
    private giftCardProvider: GiftCardProvider,
    private navCtrl: NavController
  ) {}

  async ngOnInit() {
    this.allCards = await this.giftCardProvider.getAvailableCards().catch(_ => {
      this.showError();
      return [] as CardConfig[];
    });
    this.updateCardList();
    this.numFeaturedCards = this.featuredCards.length;
    this.numMoreCards = this.moreCards.length;
  }

  onSearch(query: string) {
    this.searchQuery = query;
    this.updateCardList();
  }

  updateCardList() {
    const matchingCards = this.allCards.filter(c =>
      isCardInSearchResults(c, this.searchQuery)
    );
    this.featuredCards = matchingCards.filter(c => c.featured);
    this.moreCards = matchingCards.filter(c => !c.featured);
  }

  buyCard(cardConfig: CardConfig) {
    this.navCtrl.push(BuyCardPage, { cardConfig });
  }

  private showError() {
    const errorInfoSheet = this.actionSheetProvider.createInfoSheet(
      'gift-cards-unavailable'
    );
    errorInfoSheet.present();
    errorInfoSheet.onDidDismiss(() => this.navCtrl.pop());
  }
}

export function isCardInSearchResults(c: CardConfig, search: string) {
  const cardName = c.name.toLowerCase();
  const query = search.toLowerCase();
  const matchableText = [cardName, stripPunctuation(cardName)];
  return matchableText.some(text => text.indexOf(query) > -1);
}

export function stripPunctuation(text: string) {
  return text.replace(/[^\w\s]|_/g, '');
}
