import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { CoinbasePage } from '../integrations/coinbase/coinbase';
import { ShapeshiftPage } from '../integrations/shapeshift/shapeshift';

export function setPrice(isFiat: boolean, amount: number) {
  return {
    fiat: isFiat ? amount : undefined,
    qty: isFiat ? undefined : amount
  };
}

export interface Price {
  qty?: number;
  amount?: number;
}

@Component({
  selector: 'page-integrations',
  templateUrl: 'integrations.html'
})
export class IntegrationsPage {
  public homeIntegrations;

  constructor(private navCtrl: NavController, private navParams: NavParams) {
    this.homeIntegrations = this.navParams.data.homeIntegrations;
  }

  public goTo(page: string): void {
    const pageMap = {
      CoinbasePage,
      ShapeshiftPage
    };
    this.navCtrl.push(pageMap[page]);
  }
}
