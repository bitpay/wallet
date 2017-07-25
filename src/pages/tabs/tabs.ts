import { Component } from '@angular/core';

import { HomePage } from '../home/home';
import { ReceivePage } from '../receive/receive';
import { SendPage } from '../send/send';
import { SettingPage } from '../setting/setting';

@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {

  homeRoot = HomePage;
  receiveRoot = ReceivePage;
  sendRoot = SendPage;
  settingRoot = SettingPage;

  constructor() {

  }
}
