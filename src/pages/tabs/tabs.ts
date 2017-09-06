import { Component } from '@angular/core';
import { IonicPage } from 'ionic-angular';
import { HomePage } from '../home/home';
import { ReceivePage } from '../receive/receive';
import { ScanPage } from '../scan/scan';
import { SendPage } from '../send/send';
import { SettingsPage } from '../settings/settings';

@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {

  homeRoot = HomePage;
  receiveRoot = ReceivePage;
  scanRoot = ScanPage;
  sendRoot = SendPage;
  settingsRoot = SettingsPage;

  constructor() {

  }
}
