import { Injectable } from '@angular/core';
import { Tabs } from 'ionic-angular';
import { Coin } from '../../providers/wallet/wallet';

export interface SendParams {
  amount: string;
  coin: Coin;
  useSendMax: boolean;
}

@Injectable()
export class WalletTabsProvider {
  private tabNav: Tabs;
  private sendParams: SendParams;
  private fromPage;

  goToTabIndex(index: number) {
    return this.tabNav.select(index);
  }

  setTabNav(nav: Tabs) {
    this.tabNav = nav;
  }

  getTabNav() {
    return this.tabNav;
  }

  setSendParams(params: SendParams) {
    this.sendParams = params;
  }

  getSendParams() {
    return this.sendParams;
  }

  setFromPage(page) {
    this.fromPage = page;
  }

  getFromPage() {
    return this.fromPage;
  }

  clear() {
    this.tabNav = null;
    this.sendParams = null;
    this.fromPage = null;
  }
}
