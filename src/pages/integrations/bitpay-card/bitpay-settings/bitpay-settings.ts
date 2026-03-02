import { Component } from '@angular/core';
import { ActionSheetController, NavController, NavParams } from 'ionic-angular';

import * as _ from 'lodash';

// Providers
import { TranslateService } from '@ngx-translate/core';
import { BitPayAccountProvider } from '../../../../providers/bitpay-account/bitpay-account';
import { BitPayCardProvider } from '../../../../providers/bitpay-card/bitpay-card';
import { ConfigProvider } from '../../../../providers/config/config';
import { ExternalLinkProvider } from '../../../../providers/external-link/external-link';
import { HomeIntegrationsProvider } from '../../../../providers/home-integrations/home-integrations';
import { PopupProvider } from '../../../../providers/popup/popup';

@Component({
  selector: 'page-bitpay-settings',
  templateUrl: 'bitpay-settings.html'
})
export class BitPaySettingsPage {
  private serviceName: string = 'debitcard';
  public showAtHome;
  public service;
  public bitpayCard;
  public accounts;

  constructor(
    private navParams: NavParams,
    private navCtrl: NavController,
    private bitpayAccountProvider: BitPayAccountProvider,
    private bitPayCardProvider: BitPayCardProvider,
    private popupProvider: PopupProvider,
    private configProvider: ConfigProvider,
    private translate: TranslateService,
    private homeIntegrationsProvider: HomeIntegrationsProvider,
    private actionSheetCtrl: ActionSheetController,
    private externalLinkProvider: ExternalLinkProvider
  ) {
    this.service = _.filter(this.homeIntegrationsProvider.get(), {
      name: this.serviceName
    });
    this.showAtHome = !!this.service[0].show;
  }

  ionViewWillEnter() {
    let cardId = this.navParams.data.id;
    if (cardId) {
      this.bitPayCardProvider.getCards(cards => {
        this.bitpayCard = _.find(cards, { id: cardId });
      });
    } else {
      this.service = _.filter(this.homeIntegrationsProvider.get(), {
        name: this.serviceName
      });
      this.showAtHome = !!this.service[0].show;
    }
    this.bitpayAccountProvider.getAccounts((err, accounts) => {
      if (err) {
        this.popupProvider.ionicAlert(this.translate.instant('Error'), err);
        return;
      }
      this.accounts = accounts;
    });
  }

  public integrationChange(): void {
    let opts = {
      showIntegration: { [this.serviceName]: this.showAtHome }
    };
    this.homeIntegrationsProvider.updateConfig(
      this.serviceName,
      this.showAtHome
    );
    this.configProvider.set(opts);
  }

  public unlinkCard(card) {
    let title = 'Unlink BitPay Card?';
    let msg =
      'Are you sure you would like to remove your BitPay Card (' +
      card.lastFourDigits +
      ') from this device?';
    this.popupProvider.ionicConfirm(title, msg).then(res => {
      if (res) {
        this.bitPayCardProvider.remove(card.id, err => {
          if (err) {
            this.popupProvider.ionicAlert('Error', 'Could not remove the card');
            return;
          }
          this.navCtrl.pop();
        });
      }
    });
  }

  public unlinkAccount(card) {
    let title = 'Unlink BitPay Account?';
    let msg =
      'Are you sure you would like to remove your BitPay Account (' +
      card.email +
      ') and all associated cards from this device?';
    this.popupProvider.ionicConfirm(title, msg).then(res => {
      if (res) {
        this.bitpayAccountProvider.removeAccount(card.email, () => {
          this.navCtrl.pop();
        });
      }
    });
  }

  public connectBitPayCard() {
    this.bitPayCardProvider.logEvent('legacycard_connect', {});
    if (this.accounts.length == 0) {
      this.startPairBitPayAccount();
    } else {
      this.showAccountSelector();
    }
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

  private startPairBitPayAccount() {
    this.navCtrl.popToRoot({ animate: false }); // Back to Root
    let url = 'https://bitpay.com/visa/dashboard/add-to-bitpay-wallet-confirm';
    this.externalLinkProvider.open(url);
  }
}
