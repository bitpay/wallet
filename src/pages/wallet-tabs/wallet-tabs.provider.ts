import { Injectable } from '@angular/core';
import { Tabs } from 'ionic-angular';

@Injectable()
export class WalletTabsProvider {
  tabNav: Tabs;

  getTabNav() {
    return this.tabNav;
  }

  setTabNav(nav: Tabs) {
    this.tabNav = nav;
  }

  clearTabNav() {
    this.tabNav = null;
  }
}
