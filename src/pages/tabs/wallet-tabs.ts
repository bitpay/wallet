import { Component, ViewChild } from '@angular/core';
import { NavParams } from 'ionic-angular';
import { ReceivePage } from '../receive/receive';
import { SendPage } from '../send/send';
import { WalletDetailsPage } from '../wallet-details/wallet-details';

@Component({
  template: `
  <ion-tabs selectedIndex="1" #tabs>
    <ion-tab [root]="receiveRoot" tabTitle="{{'Receive'|translate}}" tabIcon="tab-receive" [rootParams]="rootParams"></ion-tab>
    <ion-tab [root]="activityRoot" tabTitle="{{'Activity'|translate}}" tabIcon="tab-activity" [rootParams]="rootParams"></ion-tab>
    <ion-tab [root]="sendRoot" tabTitle="{{'Send'|translate}}" tabIcon="tab-send" [rootParams]="rootParams"></ion-tab>
  </ion-tabs>
  `
})
export class WalletTabsPage {
  @ViewChild('tabs') tabs: any;

  receiveRoot = ReceivePage;
  activityRoot = WalletDetailsPage;
  sendRoot = SendPage;

  rootParams: NavParams;

  constructor(private navParams: NavParams) {
    this.rootParams = this.navParams;
  }
}
