import { Component, NgZone } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { ActionSheetProvider } from '../../../../providers';
import { hasVisibleDiscount } from '../../../../providers/gift-card/gift-card';
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
  printAlertShown = false;
  hasPercentageDiscount: boolean = false;

  constructor(
    private actionSheetProvider: ActionSheetProvider,
    private nav: NavController,
    private navParams: NavParams,
    private zone: NgZone
  ) {}

  async ngOnInit() {
    this.cardConfig = this.navParams.get('cardConfig');
    this.hasPercentageDiscount = hasVisibleDiscount(this.cardConfig);
  }

  ionViewWillEnter() {
    if (this.cardConfig.printRequired && !this.printAlertShown) {
      this.printAlertShown = true;
      this.actionSheetProvider
        .createInfoSheet('print-required', {
          displayName: this.cardConfig.displayName
        })
        .present();
    }
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
    this.zone.run(() => (this.amount = amount));
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
