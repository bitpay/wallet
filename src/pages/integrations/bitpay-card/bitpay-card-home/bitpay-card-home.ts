import { Component, Input, OnInit } from '@angular/core';
import { NavController } from 'ionic-angular';

// Providers
import {
  AppProvider,
  InAppBrowserProvider,
  PersistenceProvider
} from '../../../../providers';

// Pages
import { BitPayCardPage } from '../../../integrations/bitpay-card/bitpay-card';
import { BitPayCardIntroPage } from '../../../integrations/bitpay-card/bitpay-card-intro/bitpay-card-intro';

@Component({
  selector: 'bitpay-card-home',
  templateUrl: 'bitpay-card-home.html'
})
export class BitPayCardHome implements OnInit {
  public appName: string;
  @Input() showBitpayCardGetStarted: boolean;
  @Input() bitpayCardItems: any;

  constructor(
    private appProvider: AppProvider,
    private navCtrl: NavController,
    private persistenceProvider: PersistenceProvider,
    private iab: InAppBrowserProvider
  ) {}

  ngOnInit() {
    this.appName = this.appProvider.info.userVisibleName;
  }

  public goToBitPayCardIntroPage() {
    this.navCtrl.push(BitPayCardIntroPage);
  }

  public goToCard(cardId): void {
    this.persistenceProvider.getCardExperimentFlag().then((status: string) => {
      if (status === 'enabled') {
        this.iab.refs.card.executeScript(
          {
            code: `window.postMessage(${JSON.stringify({
              message: 'openDashboard'
            })}, '*')`
          },
          () => {
            this.iab.refs.card.show();
          }
        );
      } else {
        this.navCtrl.push(BitPayCardPage, { id: cardId });
      }
    });
  }
}
