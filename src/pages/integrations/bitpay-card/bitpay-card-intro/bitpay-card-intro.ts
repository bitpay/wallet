import { Component } from '@angular/core';
import { NavParams, NavController, ActionSheetController } from 'ionic-angular';

import * as _ from 'lodash';

//providers
import { BitPayAccountProvider } from '../../../../providers/bitpay-account/bitpay-account';
import { PopupProvider } from '../../../../providers/popup/popup';
import { BitPayCardProvider } from '../../../../providers/bitpay-card/bitpay-card';
import { ExternalLinkProvider } from '../../../../providers/external-link/external-link';

//pages
import { BitPayCardPage } from '../bitpay-card';

@Component({
  selector: 'page-bitpay-card-intro',
  templateUrl: 'bitpay-card-intro.html',
})
export class BitPayCardIntroPage {

  public accounts: any;

  constructor(
    private actionSheetCtrl: ActionSheetController,
    private navParams: NavParams,
    private bitPayAccountProvider: BitPayAccountProvider,
    private popupProvider: PopupProvider,
    private bitPayCardProvider: BitPayCardProvider,
    private navCtrl: NavController,
    private externalLinkProvider: ExternalLinkProvider
  ) {
  }

  ionViewWillEnter() {
    if (this.navParams.data.secret) {
      let pairData = {
        secret: this.navParams.data.secret,
        email: this.navParams.data.email,
        otp: this.navParams.data.otp
      };
      let pairingReason = 'add your BitPay Visa card(s)'; //TODO gettextcatalog
      this.bitPayAccountProvider.pair(pairData, pairingReason, (err: string, paired: boolean, apiContext: any) => {
        if (err) {
          this.popupProvider.ionicAlert('Error pairing BitPay Account', err); //TODO gettextcatalog
          return;
        }
        if (paired) {
          this.bitPayCardProvider.sync(apiContext, (err, cards) => {
            if (err) {
              this.popupProvider.ionicAlert('Error updating Debit Cards', err); //TODO gettextcatalog
              return;
            }
            this.navCtrl.pop();
            if (cards[0]) this.navCtrl.push(BitPayCardPage, { id: cards[0].id });
          });
        }
      });
    }

    this.bitPayAccountProvider.getAccounts((err, accounts) => {
      if (err) {
        this.popupProvider.ionicAlert('Error', err); //TODO gettextcatalog
        return;
      }
      this.accounts = accounts;
    });
  }


  public bitPayCardInfo() {
    let url = 'https://bitpay.com/visa/faq';
    this.externalLinkProvider.open(url);
  }

  public orderBitPayCard() {
    let url = 'https://bitpay.com/visa/get-started';
    this.externalLinkProvider.open(url);
  }

  public connectBitPayCard() {
    if (this.accounts.length == 0) {
      this.startPairBitPayAccount();
    } else {
      this.showAccountSelector();
    }
  }

  private startPairBitPayAccount() {
    let url = 'https://bitpay.com/visa/dashboard/add-to-bitpay-wallet-confirm';
    this.externalLinkProvider.open(url);
  }

  private showAccountSelector() {
    let options:Array<any> = [];

    _.forEach(this.accounts, (account: any) => {
      options.push(
        {
          text: (account.givenName || account.familyName) + ' (' + account.email + ')',
          handler: () => {
            this.onAccountSelect(account);
          }
        }
      );
    });

    // Cancel
    options.push(
      {
        text: 'Cancel',
        role: 'cancel',
        handler: () => {
          this.navCtrl.pop();
        }
      }
    );

    let actionSheet = this.actionSheetCtrl.create({
      title: 'From BitPay account',
      buttons: options
    });
    actionSheet.present();
  }

  private onAccountSelect(account): void {
    if (account == undefined) {
      this.startPairBitPayAccount();
    } else {
      this.bitPayCardProvider.sync(account.apiContext, (err, data) => {
        if (err) {
          this.popupProvider.ionicAlert('Error', err); //TODO gettextcatalog
          return;
        }
        this.navCtrl.pop();
      });
    }
  }

}
