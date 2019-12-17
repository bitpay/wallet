import { Component, OnInit } from '@angular/core';
import { NavController } from 'ionic-angular';

// Providers
import { AppProvider } from '../../../../providers';
import { BitPayCardProvider } from '../../../../providers/bitpay-card/bitpay-card';
import { HomeIntegrationsProvider } from '../../../../providers/home-integrations/home-integrations';

// Pages
import { BitPayCardPage } from '../../../integrations/bitpay-card/bitpay-card';
import { BitPayCardIntroPage } from '../../../integrations/bitpay-card/bitpay-card-intro/bitpay-card-intro';

@Component({
  selector: 'bitpay-card-home',
  templateUrl: 'bitpay-card-home.html'
})
export class BitPayCardHome implements OnInit {
  public appName: string;
  public showBitpayCardGetStarted: boolean;
  public bitpayCardItems: any;

  constructor(
    private appProvider: AppProvider,
    private navCtrl: NavController,
    private bitPayCardProvider: BitPayCardProvider,
    private homeIntegrationsProvider: HomeIntegrationsProvider
  ) { }

  async ngOnInit() {
    this.appName = this.appProvider.info.userVisibleName;
    this.showBitpayCardGetStarted = this.homeIntegrationsProvider.shouldShowInHome(
      'debitcard'
    );
    this.bitpayCardItems = await this.bitPayCardProvider.get({ noHistory: true });
  }

  public goToBitPayCardIntroPage() {
    this.navCtrl.push(BitPayCardIntroPage);
  }

  public goToCard(cardId): void {
    this.navCtrl.push(BitPayCardPage, { id: cardId });
  }
}
