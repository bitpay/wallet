import { Component, Input, OnInit } from '@angular/core';
import { NavController } from 'ionic-angular';

// Providers
import { AppProvider } from '../../../../providers';

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
  @Input() public bitpayCardItems: any;

  constructor(
    private appProvider: AppProvider,
    private navCtrl: NavController
  ) {}

  async ngOnInit() {
    this.appName = this.appProvider.info.userVisibleName;
  }

  public goToBitPayCardIntroPage() {
    this.navCtrl.push(BitPayCardIntroPage);
  }

  public goToCard(cardId): void {
    this.navCtrl.push(BitPayCardPage, { id: cardId });
  }
}
