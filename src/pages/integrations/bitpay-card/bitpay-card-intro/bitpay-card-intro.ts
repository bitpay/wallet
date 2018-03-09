import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ActionSheetController, NavController, NavParams } from 'ionic-angular';

import * as _ from 'lodash';

// providers
import { BitPayAccountProvider } from '../../../../providers/bitpay-account/bitpay-account';
import { BitPayCardProvider } from '../../../../providers/bitpay-card/bitpay-card';
import { ExternalLinkProvider } from '../../../../providers/external-link/external-link';
import { PopupProvider } from '../../../../providers/popup/popup';

// pages
import { BitPayCardPage } from '../bitpay-card';

@Component({
  selector: 'page-bitpay-card-intro',
  templateUrl: 'bitpay-card-intro.html',
})
export class BitPayCardIntroPage {

  public accounts: any;

  constructor(
    private translate: TranslateService,
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
      let pairingReason = this.translate.instant('add your BitPay Visa card(s)');
      this.bitPayAccountProvider.pair(pairData, pairingReason, (err: string, paired: boolean, apiContext: any) => {
        if (err) {
          this.popupProvider.ionicAlert(this.translate.instant('Error pairing BitPay Account'), err);
          return;
        }
        if (paired) {
          this.bitPayCardProvider.sync(apiContext, (err, cards) => {
            if (err) {
              this.popupProvider.ionicAlert(this.translate.instant('Error updating Debit Cards'), err);
              return;
            }
            this.navCtrl.popToRoot({ animate: false }).then(() => {
              this.navCtrl.parent.select(0);
              if (cards[0]) this.navCtrl.push(BitPayCardPage, { id: cards[0].id });
            });
          });
        }
      });
    }

    this.bitPayAccountProvider.getAccounts((err, accounts) => {
      if (err) {
        this.popupProvider.ionicAlert(this.translate.instant('Error'), err);
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
    let options:any[] = [];

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
        text: this.translate.instant('Cancel'),
        role: 'cancel',
        handler: () => {
          this.navCtrl.pop();
        }
      }
    );

    let actionSheet = this.actionSheetCtrl.create({
      title: this.translate.instant('From BitPay account'),
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
          this.popupProvider.ionicAlert(this.translate.instant('Error'), err);
          return;
        }
        this.navCtrl.pop();
      });
    }
  }

}
