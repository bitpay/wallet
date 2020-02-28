import { Component, Input, OnInit } from '@angular/core';
import { NavController } from 'ionic-angular';

// Providers
import { AppProvider, InAppBrowserProvider } from '../../../../providers';

// Pages
import { BitPayCardPage } from '../../../integrations/bitpay-card/bitpay-card';
import { BitPayCardIntroPage } from '../bitpay-card-intro/bitpay-card-intro';

@Component({
  selector: 'bitpay-card-home',
  templateUrl: 'bitpay-card-home.html'
})
export class BitPayCardHome implements OnInit {
  public appName: string;
  public firstViewCardPhases: string;
  @Input() showBitpayCardGetStarted: boolean;
  @Input() public bitpayCardItems: any;
  @Input() cardExperimentEnabled: boolean;

  constructor(
    private appProvider: AppProvider,
    private navCtrl: NavController,
    private iab: InAppBrowserProvider
  ) {}

  ngOnInit() {
    this.appName = this.appProvider.info.userVisibleName;
  }

  public goToBitPayCardIntroPage() {
    this.navCtrl.push(BitPayCardIntroPage);
  }

  public goToCard(cardId): void {
    if (this.cardExperimentEnabled) {
      const message = `loadDashboard?${cardId}`;
      this.iab.refs.card.executeScript(
        {
          code: `window.postMessage(${JSON.stringify({
            message
          })}, '*')`
        },
        () => {
          this.iab.refs.card.show();
        }
      );
    } else {
      this.navCtrl.push(BitPayCardPage, { id: cardId });
    }
  }
}
