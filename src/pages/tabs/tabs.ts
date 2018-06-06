import { Component, ElementRef, ViewChild } from '@angular/core';
import { HomePage } from '../home/home';
import { ReceivePage } from '../receive/receive';
import { ScanPage } from '../scan/scan';
import { SendPage } from '../send/send';
import { SettingsPage } from '../settings/settings';

@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {
  @ViewChild('tabs') tabs;

  homeRoot = HomePage;
  receiveRoot = ReceivePage;
  scanRoot = ScanPage;
  sendRoot = SendPage;
  settingsRoot = SettingsPage;

  constructor(private element: ElementRef) {
    console.log('this.element', this.element);
  }
}
