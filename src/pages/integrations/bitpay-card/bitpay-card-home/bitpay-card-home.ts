import { Component, OnInit } from '@angular/core';
import { Events, NavController } from 'ionic-angular';

// Providers
import { AppProvider } from '../../../../providers';
import { ConfigProvider } from '../../../../providers/config/config';
import { HomeIntegrationsProvider } from '../../../../providers/home-integrations/home-integrations';

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
    private navCtrl: NavController,
    private homeIntegrationsProvider: HomeIntegrationsProvider,
    private configProvider: ConfigProvider,
    private events: Events
  ) {}

  async ngOnInit() {
    this.appName = this.appProvider.info.userVisibleName;
  }

  public goToBitPayCardIntroPage() {
    this.navCtrl.push(BitPayCardIntroPage);
  }

  public hideHomeCard() {
    const serviceName = 'debitcard';
    const showAtHome = false;
    const opts = {
      showIntegration: { [serviceName]: showAtHome }
    };
    this.homeIntegrationsProvider.updateConfig(serviceName, showAtHome);
    this.configProvider.set(opts);
    this.events.publish('Home/reloadStatus');
  }
}
