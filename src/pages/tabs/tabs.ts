import { Component, ViewChild } from '@angular/core';
import { CardsPage } from '../cards/cards';
import { HomePage } from '../home/home';
import { SettingsPage } from '../settings/settings';
import { WalletsPage } from '../wallets/wallets';
@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {
  @ViewChild('tabs')
  tabs;

  homeRoot = HomePage;
  walletsRoot = WalletsPage;
  cardsRoot = CardsPage;
  settingsRoot = SettingsPage;
}
