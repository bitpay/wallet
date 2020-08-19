import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import * as _ from 'lodash';

// Pages
import { SimplexPage } from '../../../pages/integrations/simplex/simplex';
import { WyrePage } from '../../../pages/integrations/wyre/wyre';

// Providers
import { BuyCryptoProvider } from '../../../providers/buy-crypto/buy-crypto';
import { ConfigProvider } from '../../../providers/config/config';
import { HomeIntegrationsProvider } from '../../../providers/home-integrations/home-integrations';
import { Logger } from '../../../providers/logger/logger';
import { ThemeProvider } from '../../../providers/theme/theme';

@Component({
  selector: 'page-crypto-settings',
  templateUrl: 'crypto-settings.html'
})
export class CryptoSettingsPage {
  private serviceName: string = 'buycrypto';

  public showInHome;
  public service;
  public simplexPaymentRequests: any[];
  public wyrePaymentRequests: any[];

  constructor(
    private configProvider: ConfigProvider,
    private homeIntegrationsProvider: HomeIntegrationsProvider,
    private logger: Logger,
    private navCtrl: NavController,
    private buyCryptoProvider: BuyCryptoProvider,
    public themeProvider: ThemeProvider
  ) {
    this.service = _.filter(this.homeIntegrationsProvider.get(), {
      name: this.serviceName
    });
    this.showInHome = !!this.service[0].show;
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: CryptoSettingsPage');
  }

  ionViewWillEnter() {
    this.buyCryptoProvider.getPaymentRequests().then(res => {
      this.simplexPaymentRequests = res.simplexPaymentRequests;
      this.wyrePaymentRequests = res.wyrePaymentRequests;
    });
  }

  public goToSimplexPage(): void {
    this.navCtrl.push(SimplexPage);
  }

  public goToWyrePage(): void {
    this.navCtrl.push(WyrePage);
  }

  public showInHomeSwitch(): void {
    let opts = {
      showIntegration: { [this.serviceName]: this.showInHome }
    };
    this.homeIntegrationsProvider.updateConfig(
      this.serviceName,
      this.showInHome
    );
    this.configProvider.set(opts);
  }
}
