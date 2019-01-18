import { Component, OnInit, ViewChild } from '@angular/core';
import { NavController } from 'ionic-angular';

import { BuyCardPage } from '../buy-card/buy-card';

import { ActionSheetProvider } from '../../../../providers';
import { GiftCardProvider } from '../../../../providers/gift-card/gift-card';
import {
  CardConfig,
  CardName
} from '../../../../providers/gift-card/gift-card.types';
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
  }

  onSearch(query: string) {
    this.searchQuery = query;
    this.updateCardList();
  }

  updateCardList() {
    const matchingCards = this.allCards.filter(c =>
      isCardInSearchResults(c, this.searchQuery)
    );
    this.featuredCards = matchingCards.filter(c => isCardFeatured(c));
    this.moreCards = matchingCards.filter(c => !isCardFeatured(c));
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

export function isCardFeatured(c: CardConfig) {
  const featuredCardNames = [
    CardName.amazon,
    CardName.amazonJapan,
    CardName.delta,
    CardName.googlePlay,
    CardName.hotelsCom,
    CardName.mercadoLibre,
    CardName.uber,
    CardName.uberEats
  ];
  return featuredCardNames.indexOf(c.name) !== -1;
}

export function isCardInSearchResults(c: CardConfig, search: string) {
  return c.name.toLowerCase().indexOf(search.toLowerCase()) > -1;
}
