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
  public visibleCards: CardConfig[];
  public allCards: CardConfig[];

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
    this.visibleCards = [...this.allCards];
  }

  onSearch(query: string) {
    this.visibleCards = this.allCards.filter(
      c => c.name.toLowerCase().indexOf(query.toLowerCase()) > -1
    );
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
