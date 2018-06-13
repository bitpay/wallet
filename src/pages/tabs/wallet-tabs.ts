import { Component, ViewChild } from '@angular/core';
import { NavParams } from 'ionic-angular';
import { ReceivePage } from '../receive/receive';
import { AmountPage } from '../send/amount/amount';
// import { SendPage } from '../send/send';
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
  @ViewChild('tabs') walletTabs: any;

  receiveRoot = ReceivePage;
  activityRoot = WalletDetailsPage;
  sendRoot = AmountPage;
  // sendRoot = SendPage;

  rootParams: NavParams;
  walletId: string;

  constructor(private navParams: NavParams) {
    this.rootParams = this.navParams;
    this.walletId = this.rootParams.get('walletId');
  }
}
