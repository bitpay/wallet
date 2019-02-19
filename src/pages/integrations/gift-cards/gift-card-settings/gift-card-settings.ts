import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavController, NavParams } from 'ionic-angular';
import * as _ from 'lodash';
import {
  ActionSheetProvider,
  GiftCardProvider,
  Logger,
  PopupProvider
} from '../../../../providers';
import { PurchasedCardsPage } from '../purchased-cards/purchased-cards';

@Component({
  selector: 'gift-card-settings-page',
  templateUrl: 'gift-card-settings.html'
})
export class GiftCardSettingsPage extends PurchasedCardsPage {
  email: string;

  constructor(
    actionSheetProvider: ActionSheetProvider,
    giftCardProvider: GiftCardProvider,
    logger: Logger,
    navCtrl: NavController,
    navParams: NavParams,
    private popupProvider: PopupProvider,
    private translate: TranslateService
  ) {
    super(actionSheetProvider, giftCardProvider, logger, navCtrl, navParams);
  }

  async ionViewDidLoad() {
    this.initialize();
  }

  protected async getCards(): Promise<any> {
    await this.giftCardProvider
      .getAllCardsOfBrand(this.cardConfig.displayName)
      .then(cards => this.setGiftCards(cards))
      .catch(err => this.logger.error(err));
    this.giftCardProvider.updatePendingGiftCards(this.currentGiftCards);
  }

  private async initialize() {
    this.email = await this.giftCardProvider.getUserEmail();
  }

  public setEmail() {
    let title = this.translate.instant('Enter email address');
    let message = this.translate.instant(
      'Where would you like to receive your Amazon gift card purchase receipts?'
    );
    let opts = { type: 'email', defaultText: this.email || '' };
    this.popupProvider.ionicPrompt(title, message, opts).then(email => {
      if (_.isNull(email)) return;
      if (this.email == email) return;
      if (!_.isEmpty(email) && !this.giftCardProvider.emailIsValid(email)) {
        let t = this.translate.instant('Invalid Email');
        let ok = this.translate.instant('Try again');
        this.popupProvider.ionicAlert(t, null, ok).then(_ => {
          this.setEmail();
        });
        return;
      }
      this.email = email;
      this.giftCardProvider.storeEmail(this.email);
    });
  }

  protected removePageFromHistory() {
    // Override extended behavior and don't remove page from history.
  }
}
