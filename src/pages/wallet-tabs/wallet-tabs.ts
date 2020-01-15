import { Component, ViewChild } from '@angular/core';
import { StatusBar } from '@ionic-native/status-bar';
import { Events, NavParams } from 'ionic-angular';

// Pages
import { ReceivePage } from '../receive/receive';
import { SendPage } from '../send/send';
import { WalletDetailsPage } from '../wallet-details/wallet-details';

// Providers
import { PlatformProvider } from '../../providers/platform/platform';
import { WalletTabsProvider } from './wallet-tabs.provider';
import { InAppBrowserProvider, Logger } from '../../providers';
import { InAppBrowserRef } from '../../models/in-app-browser/in-app-browser-ref.model';

@Component({
  template: `
    <ion-tabs [selectedIndex]="selectedTabIndex" #tabs>
      <ion-tab
        [root]="receiveRoot"
        tabTitle="{{'Receive'|translate}}"
        tabIcon="tab-receive"
      ></ion-tab>
      <ion-tab
        [root]="activityRoot"
        tabTitle="{{'Activity'|translate}}"
        tabIcon="tab-activity"
      ></ion-tab>
      <ion-tab
        [root]="sendRoot"
        tabTitle="{{'Send'|translate}}"
        tabIcon="tab-send"
      ></ion-tab>
    </ion-tabs>
  `
})
export class WalletTabsPage {
  @ViewChild('tabs')
  walletTabs: any;
  private cardIAB_Ref: InAppBrowserRef;
  receiveRoot = ReceivePage;
  activityRoot = WalletDetailsPage;
  sendRoot = SendPage;

  selectedTabIndex: number = 1;

  walletId: string;

  constructor(
    private navParams: NavParams,
    private walletTabsProvider: WalletTabsProvider,
    private events: Events,
    private iab: InAppBrowserProvider,
    private platformProvider: PlatformProvider,
    private statusBar: StatusBar,
    private logger: Logger
  ) {
    if (typeof this.navParams.get('selectedTabIndex') !== 'undefined') {
      this.selectedTabIndex = this.navParams.get('selectedTabIndex');
    }

  }

  ionViewDidLoad() {
    this.walletId = this.navParams.get('walletId');

    const redir = this.navParams.get('redir');
    if (redir && redir === 'wc') {
      setTimeout( () => {
        this.cardIAB_Ref.executeScript(
          {
            code: `window.postMessage(${JSON.stringify({"message": "paymentBroadcasted"})}, '*')`
          },
          () => {
            this.logger.log('card IAB -> payment broadcasting opening IAB');
          }
        );
        this.cardIAB_Ref.show();
      }, 1000);
    }
  }

  ionViewWillEnter() {
    if (this.platformProvider.isIOS) {
      setTimeout(() => this.statusBar.styleLightContent(), 300);
    }
    this.cardIAB_Ref = this.iab.refs.card;
  }

  ionViewWillLeave() {
    if (this.platformProvider.isIOS) {
      this.statusBar.styleDefault();
    }
  }

  ngAfterViewInit() {
    this.walletTabsProvider.setTabNav(this.walletTabs);
  }

  ngOnDestroy() {
    this.walletTabsProvider.clear();
    this.events.publish('Wallet/disableHardwareKeyboard');
    this.unsubscribeChildPageEvents();
  }

  private unsubscribeChildPageEvents() {
    this.events.unsubscribe('Local/AddressScan');
    this.events.unsubscribe('Wallet/disableHardwareKeyboard');
  }
}
