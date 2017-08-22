import { Component } from '@angular/core';

import { HomePage } from '../home/home';
import { ReceivePage } from '../receive/receive';
import { ScanPage } from '../scan/scan';
import { SendPage } from '../send/send';
import { SettingPage } from '../setting/setting';

@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {

  homeRoot = HomePage;
  receiveRoot = ReceivePage;
  scanRoot = ScanPage;
  sendRoot = SendPage;
  settingRoot = SettingPage;

  constructor() {

  }
}
