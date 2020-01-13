import { Component, ViewChild } from '@angular/core';
import { AppProvider } from '../../providers/app/app';
import { CardsPage } from '../cards/cards';
import { HomePage } from '../home/home';
import { SettingsPage } from '../settings/settings';
import { WalletsPage } from '../wallets/wallets';
@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {
  appName: boolean;
  @ViewChild('tabs')
  tabs;

  constructor(private appProvider: AppProvider) {
    this.appName = this.appProvider.info.nameCase;
  }

  homeRoot = HomePage;
  walletsRoot = WalletsPage;
  cardsRoot = CardsPage;
  settingsRoot = SettingsPage;
}
