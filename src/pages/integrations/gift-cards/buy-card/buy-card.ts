import { Component, NgZone } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { ActionSheetProvider } from '../../../../providers';
import {
  getActivationFee,
  hasPromotion,
  hasVisibleDiscount
} from '../../../../providers/gift-card/gift-card';
import { CardConfig } from '../../../../providers/gift-card/gift-card.types';
import { AmountPage } from '../../../send/amount/amount';
import { ConfirmCardPurchasePage } from '../confirm-card-purchase/confirm-card-purchase';
import { PhonePage } from '../phone/phone';

@Component({
  selector: 'buy-card-page',
  templateUrl: 'buy-card.html'
})
export class BuyCardPage {
  amount: number;
  cardConfig: CardConfig;
  printAlertShown = false;
  hasVisibleDiscount: boolean = false;
  hasPromotion: boolean = false;

  constructor(
    private actionSheetProvider: ActionSheetProvider,
    private nav: NavController,
    private navParams: NavParams,
    private zone: NgZone
  ) {}

  async ngOnInit() {
    this.cardConfig = this.navParams.get('cardConfig');
    this.hasVisibleDiscount = hasVisibleDiscount(this.cardConfig);
    this.hasPromotion = hasPromotion(this.cardConfig);
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
      cardConfig: this.cardConfig,
      cardName: this.cardConfig.name,
      currency: this.cardConfig.currency,
      fixedUnit: true,
      onlyIntegers:
        this.cardConfig.currency === 'JPY' || this.cardConfig.integersOnly
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
      cardConfig: this.cardConfig,
      cardName: this.cardConfig.name,
      currency: this.cardConfig.currency
    };
    const page = this.cardConfig.mobilePaymentsSupported
      ? PhonePage
      : ConfirmCardPurchasePage;
    this.nav.push(page, data);
  }

  checkForActivationFee() {
    const activationFee = getActivationFee(this.amount, this.cardConfig);
    return activationFee > 0
      ? this.showActivationFeeSheet(activationFee)
      : this.continue();
  }

  showActivationFeeSheet(fee: number) {
    const sheet = this.actionSheetProvider.createInfoSheet(
      'activation-fee-included',
      {
        currency: this.cardConfig.currency,
        displayName: this.cardConfig.displayName,
        fee
      }
    );
    this.zone.run(() => sheet.present());
    sheet.onDidDismiss(ok => ok && this.continue());
  }

  next() {
    this.cardConfig && this.cardConfig.supportedAmounts
      ? this.checkForActivationFee()
      : this.enterAmount();
  }
}
