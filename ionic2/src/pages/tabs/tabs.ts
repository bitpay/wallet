import { Component } from '@angular/core';

import { HomePage } from '../home/home';
import { ReceivePage } from '../receive/receive';
import { ScanPage } from '../scan/scan';
import { SendPage } from '../send/send';
import { SettingsPage } from '../settings/settings';

@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {
  // this tells the tabs component which Pages
  // should be each tab's root Page
  tab1Root: any = HomePage;
  tab2Root: any = ReceivePage;
  tab3Root: any = ScanPage;
  tab4Root: any = SendPage;
  tab5Root: any = SettingsPage;

  constructor() {

  }
}
