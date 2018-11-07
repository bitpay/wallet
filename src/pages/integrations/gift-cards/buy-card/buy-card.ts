import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { CardConfig } from '../../../../providers/gift-card/gift-card.types';
import { AmountPage } from '../../../send/amount/amount';
import { ConfirmCardPurchasePage } from '../confirm-card-purchase/confirm-card-purchase';

@Component({
  selector: 'buy-card-page',
  templateUrl: 'buy-card.html'
})
export class BuyCardPage {
  amount: number;
  cardConfig: CardConfig;

  constructor(private nav: NavController, private navParams: NavParams) {}

  async ngOnInit() {
    this.cardConfig = this.navParams.get('cardConfig');
  }

  cancel() {
    this.nav.pop();
  }

  enterAmount() {
    this.nav.push(AmountPage, {
      nextPage: 'ConfirmCardPurchasePage',
      cardName: this.cardConfig.name,
      currency: this.cardConfig.currency,
      fixedUnit: true,
      onlyIntegers: this.cardConfig.currency === 'JPY'
    });
  }

  onAmountChange(amount: number) {
    this.amount = amount;
  }

  onAmountClick() {
    if (this.cardConfig.supportedAmounts) {
      return;
    }
    this.enterAmount();
  }

  continue() {
    const data = {
      amount: this.amount,
      currency: this.cardConfig.currency,
      cardName: this.cardConfig.name
    };
    this.nav.push(ConfirmCardPurchasePage, data);
  }

  next() {
    this.cardConfig && this.cardConfig.supportedAmounts
      ? this.continue()
      : this.enterAmount();
  }
}
