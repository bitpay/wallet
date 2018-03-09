import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

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
  public bitpayCard: any;

  constructor(
    private navParams: NavParams,
    private navCtrl: NavController,
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
    let cardId = this.navParams.data.id;
    if (cardId) {
      this.bitPayCardProvider.getCards((cards) => {
        this.bitpayCard = _.find(cards, { id: cardId });
      });
    }
    else {
      this.service = _.filter(this.homeIntegrationsProvider.get(), { name: this.serviceName });
      this.showAtHome = !!this.service[0].show;
    }
  }

  public integrationChange(): void {
    let opts = {
      showIntegration: { [this.serviceName]: this.showAtHome }
    };
    this.homeIntegrationsProvider.updateConfig(this.serviceName, this.showAtHome);
    this.configProvider.set(opts);
  }

  public unlinkCard(card: any) {
    let title = 'Unlink BitPay Card?';
    let msg = 'Are you sure you would like to remove your BitPay Card (' + card.lastFourDigits + ') from this device?';
    this.popupProvider.ionicConfirm(title, msg).then((res) => {
      if (res) {
        this.bitPayCardProvider.remove(card.id, (err) => {
          if (err) {
            this.popupProvider.ionicAlert('Error', 'Could not remove the card');
            return;
          }
          this.navCtrl.pop();
        });
      }
    });
  }

}
