import { Injectable } from '@angular/core';
import { Tabs } from 'ionic-angular';

export interface SendParams {
  amount: string;
  coin: 'btc' | 'bch';
}

@Injectable()
export class WalletTabsProvider {
  tabNav: Tabs;

  sendParams: SendParams;

  getTabNav() {
    return this.tabNav;
  }

  setTabNav(nav: Tabs) {
    this.tabNav = nav;
  }

  clearTabNav() {
    this.tabNav = null;
  }

  setSendParams(params: SendParams) {
    this.sendParams = params;
  }

  getSendParams() {
    return this.sendParams;
  }
}
