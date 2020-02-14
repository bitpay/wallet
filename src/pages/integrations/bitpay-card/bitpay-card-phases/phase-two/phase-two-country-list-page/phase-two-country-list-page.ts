import { Component, OnInit } from "@angular/core";
import { TranslateService } from '@ngx-translate/core';
import { ActionSheetController, NavController } from 'ionic-angular';

import { BitPayAccountProvider } from '../../../../../../providers/bitpay-account/bitpay-account';
import { BitPayCardProvider } from '../../../../../../providers/bitpay-card/bitpay-card';
import { ExternalLinkProvider } from '../../../../../../providers/external-link/external-link';
import { PopupProvider } from '../../../../../../providers/popup/popup';

import { PhaseTwoCardNotifyPage } from '../phase-two-notify-page/phase-two-notify-page';

import * as _ from 'lodash';

@Component({
  selector: 'page-bitpay-phase-two-country-list',
  templateUrl: './phase-two-country-list-page.html'
})
export class PhaseTwoCardCountryList implements OnInit {
  public accounts;

  constructor(
    private translate: TranslateService,
    private actionSheetCtrl: ActionSheetController,
    private bitPayAccountProvider: BitPayAccountProvider,
    private bitPayCardProvider: BitPayCardProvider,
    private externalLinkProvider: ExternalLinkProvider,
    public navCtrl: NavController,
    private popupProvider: PopupProvider,
  ) {

  }

  ngOnInit() {

  }

  ionViewWillEnter() {
    this.bitPayAccountProvider.getAccounts((err, accounts) => {
      if (err) {
        this.popupProvider.ionicAlert(this.translate.instant('Error'), err);
        return;
      }
      this.accounts = accounts;
    });
  }

  public goBack() {
    this.navCtrl.pop();
  }

  public saveCountry() {
    this.navCtrl.push(PhaseTwoCardNotifyPage);
  }

  public connectBitPayCard() {
    this.bitPayCardProvider.logEvent('legacycard_connect', {});
    if (this.accounts.length == 0) {
      this.startPairBitPayAccount();
    } else {
      this.showAccountSelector();
    }
  }

  private startPairBitPayAccount() {
    this.navCtrl.popToRoot({ animate: false }); // Back to Root
    let url = 'https://bitpay.com/visa/dashboard/add-to-bitpay-wallet-confirm';
    this.externalLinkProvider.open(url);
  }

  private showAccountSelector() {
    let options = [];

    _.forEach(this.accounts, account => {
      options.push({
        text:
          (account.givenName || account.familyName) +
          ' (' +
          account.email +
          ')',
        handler: () => {
          this.onAccountSelect(account);
        }
      });
    });

    // Add account
    options.push({
      text: this.translate.instant('Add account'),
      handler: () => {
        this.onAccountSelect();
      }
    });

    // Cancel
    options.push({
      text: this.translate.instant('Cancel'),
      role: 'cancel'
    });

    let actionSheet = this.actionSheetCtrl.create({
      title: this.translate.instant('From BitPay account'),
      buttons: options
    });
    actionSheet.present();
  }

  private onAccountSelect(account?): void {
    if (_.isUndefined(account)) {
      this.startPairBitPayAccount();
    } else {
      this.bitPayCardProvider.sync(account.apiContext, err => {
        if (err) {
          this.popupProvider.ionicAlert(this.translate.instant('Error'), err);
          return;
        }
        this.navCtrl.pop();
      });
    }
  }
}