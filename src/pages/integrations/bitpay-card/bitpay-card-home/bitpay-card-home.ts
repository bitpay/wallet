import { Component, OnInit } from '@angular/core';
import { NavController } from 'ionic-angular';

// Providers
import { AppProvider } from '../../../../providers';

// Pages
import { BitPayCardIntroPage } from '../../../integrations/bitpay-card/bitpay-card-intro/bitpay-card-intro';

@Component({
  selector: 'bitpay-card-home',
  templateUrl: 'bitpay-card-home.html'
})
export class BitPayCardHome implements OnInit {
  public appName: string;
  public disableArchiveAnimation: boolean = true; // Removes flicker on iOS when returning to home tab

  constructor(
    private appProvider: AppProvider,
    private navCtrl: NavController
  ) {}

  async ngOnInit() {
    this.appName = this.appProvider.info.userVisibleName;
  }

  public hideBitpayCardHome() {
    console.log('---------- hideBitpayCardHome()');
  }

  public goToBitPayCardIntroPage() {
    this.navCtrl.push(BitPayCardIntroPage);
  }
}
