import { Component, ViewChild } from '@angular/core';
import { Events, NavParams } from 'ionic-angular';
import { ReceivePage } from '../receive/receive';
import { AmountPage } from '../send/amount/amount';
import { WalletDetailsPage } from '../wallet-details/wallet-details';
import { WalletTabsProvider } from './wallet-tabs.provider';

@Component({
  template: `
  <ion-tabs selectedIndex="1" #tabs>
    <ion-tab [root]="receiveRoot" tabTitle="{{'Receive'|translate}}" tabIcon="tab-receive"></ion-tab>
    <ion-tab [root]="activityRoot" tabTitle="{{'Activity'|translate}}" tabIcon="tab-activity"></ion-tab>
    <ion-tab [root]="sendRoot" tabTitle="{{'Send'|translate}}" tabIcon="tab-send"></ion-tab>
  </ion-tabs>
  `
})
export class WalletTabsPage {
  @ViewChild('tabs') walletTabs: any;

  receiveRoot = ReceivePage;
  activityRoot = WalletDetailsPage;
  sendRoot = AmountPage;

  walletId: string;

  constructor(
    private navParams: NavParams,
    private walletTabsProvider: WalletTabsProvider,
    private events: Events
  ) {}

  ionViewDidLoad() {
    this.walletId = this.navParams.get('walletId');
  }

  ionViewWillEnter() {
    this.events.subscribe('bwsEvent', (walletId, type) => {
      // Update current address
      if (this.walletId == walletId && type == 'NewIncomingTx')
        this.events.publish('Wallet/setAddress');
      // Update wallet details
      if (this.walletId == walletId && type != 'NewAddress')
        this.events.publish('Wallet/updateAll');
    });
    this.events.subscribe('Local/TxAction', walletId => {
      if (this.walletId == walletId) this.events.publish('Wallet/updateAll');
    });
  }

  ionViewWillLeave() {
    this.events.unsubscribe('bwsEvent');
    this.events.unsubscribe('Local/TxAction');
    this.events.unsubscribe('Wallet/updateAll');
    this.events.unsubscribe('Wallet/setAddress');
    this.events.unsubscribe('Wallet/backupCompleted');
    this.events.unsubscribe('Wallet/disableHardwareKeyboard');
  }

  ngAfterViewInit() {
    this.walletTabsProvider.setTabNav(this.walletTabs);
  }

  ngOnDestroy() {
    this.walletTabsProvider.clear();
  }
}
