import { Component } from '@angular/core';
import { ItemSliding } from 'ionic-angular';

import * as _ from 'lodash';

// Providers
import { BitPayAccountProvider } from '../../../../providers/bitpay-account/bitpay-account';
import { BitPayCardProvider } from '../../../../providers/bitpay-card/bitpay-card';
import { ConfigProvider } from '../../../../providers/config/config';
import { HomeIntegrationsProvider } from '../../../../providers/home-integrations/home-integrations';
import { PopupProvider } from '../../../../providers/popup/popup';


@Component({
  selector: 'page-bitpay-settings',
  templateUrl: 'bitpay-settings.html',
})
export class BitPaySettingsPage {

  private serviceName: string = 'debitcard';
  public showAtHome: any;
  public service: any;
  public bitpayAccounts: any;
  public bitpayCards: any;

  constructor(
    private bitpayAccountProvider: BitPayAccountProvider,
    private bitPayCardProvider: BitPayCardProvider,
    private popupProvider: PopupProvider,
    private configProvider: ConfigProvider,
    private homeIntegrationsProvider: HomeIntegrationsProvider
  ) {
    this.service = _.filter(this.homeIntegrationsProvider.get(), { name: this.serviceName });
    this.showAtHome = !!this.service[0].show;
  }

  ionViewWillEnter() {
    this.init();
  }

  private init(): void {
    this.bitpayAccountProvider.getAccounts((err, accounts) => {
      if (err) return;
      this.bitpayAccounts = accounts;

      this.bitPayCardProvider.getCards((cards) => {
        this.bitpayCards = cards;
      });
    });
  }

  public integrationChange(): void {
    let opts = {
      showIntegration: { [this.serviceName] : this.showAtHome }
    };
    this.homeIntegrationsProvider.updateConfig(this.serviceName, this.showAtHome);
    this.configProvider.set(opts);
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
        this.bitPayCardProvider.remove(card.id, (err) => {
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
