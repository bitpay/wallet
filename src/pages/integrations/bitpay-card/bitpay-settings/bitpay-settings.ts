import { Component } from '@angular/core';
import { ItemSliding } from 'ionic-angular';

import { BitPayAccountProvider } from '../../../../providers/bitpay-account/bitpay-account';
import { BitPayCardProvider } from '../../../../providers/bitpay-card/bitpay-card';
import { PopupProvider } from '../../../../providers/popup/popup';


@Component({
  selector: 'page-bitpay-settings',
  templateUrl: 'bitpay-settings.html',
})
export class BitPaySettingsPage {

  public bitpayAccounts: any;
  public bitpayCards: any;

  constructor(
    private bitpayAccountProvider: BitPayAccountProvider,
    private bitpayCardProvider: BitPayCardProvider,
    private popupProvider: PopupProvider
  ) {

  }

  ionViewWillEnter() {
    this.init();
  }

  private init(): void {
    this.bitpayAccountProvider.getAccounts((err, accounts) => {
      if (err) return;
      this.bitpayAccounts = accounts;

      this.bitpayCardProvider.getCards((cards) => {
        this.bitpayCards = cards;
      });
    });
  }

  public unlinkAccount(account: any, slidingItem: ItemSliding) {
    let title = 'Unlink BitPay Account?';
    let msg = 'Removing your BitPay account will remove all associated BitPay account data from this device. Are you sure you would like to remove your BitPay Account (' + account.email + ') from this device?';
    this.popupProvider.ionicConfirm(title, msg).then((res) => {
      slidingItem.close();
      if (res) {
        this.bitpayAccountProvider.removeAccount(account.email, () => {
          this.init();
        });
      }
    });
  }

  public unlinkCard(card: any, slidingItem: ItemSliding) {
    let title = 'Unlink BitPay Card?';
    let msg = 'Are you sure you would like to remove your BitPay Card (' + card.lastFourDigits + ') from this device?';
    this.popupProvider.ionicConfirm(title, msg).then((res) => {
      slidingItem.close();
      if (res) {
        this.bitpayCardProvider.remove(card.id, (err) => {
          if (err) {
            this.popupProvider.ionicAlert('Error', 'Could not remove the card');
            return;
          }
          this.init();
        });
      }
    });
  }

}
