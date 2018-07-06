import { Injectable } from '@angular/core';
import { Tabs } from 'ionic-angular';
import { Coin } from '../../providers/wallet/wallet';

export interface SendParams {
  amount: string;
  coin: Coin;
}

@Injectable()
export class WalletTabsProvider {
  tabNav: Tabs;

  sendParams: SendParams;

  getTabNav() {
    return this.tabNav;
  }

  goToTabIndex(index: number) {
    this.tabNav.select(index);
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
