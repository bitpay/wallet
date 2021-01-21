import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

import * as _ from 'lodash';

// Providers
import { CoinbaseProvider } from '../../../../providers/coinbase/coinbase';
import { ConfigProvider } from '../../../../providers/config/config';
import { HomeIntegrationsProvider } from '../../../../providers/home-integrations/home-integrations';
import { PopupProvider } from '../../../../providers/popup/popup';

import { CoinbasePage } from '../coinbase';

@Component({
  selector: 'page-coinbase-settings',
  templateUrl: 'coinbase-settings.html'
})
export class CoinbaseSettingsPage {
  private serviceName: string = 'coinbase';
  public showInHome;
  public service;
  public loading: boolean;

  public data: object = {};
  public linkedAccount: boolean;
  public hasCredentials: boolean;

  constructor(
    private navCtrl: NavController,
    private popupProvider: PopupProvider,
    private coinbaseProvider: CoinbaseProvider,
    private configProvider: ConfigProvider,
    private homeIntegrationsProvider: HomeIntegrationsProvider
  ) {
    this.service = _.filter(this.homeIntegrationsProvider.get(), {
      name: this.serviceName
    });
    this.showInHome = !!this.service[0].show;
  }

  ionViewWillEnter() {
    this.hasCredentials = !!this.coinbaseProvider.oauthUrl;
    this.linkedAccount = this.coinbaseProvider.isLinked();
    if (this.linkedAccount) this.coinbaseProvider.getCurrentUser(this.data);
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

  public revokeToken() {
    this.popupProvider
      .ionicConfirm(
        'Coinbase',
        'Are you sure you would like to log out of your Coinbase account?'
      )
      .then(res => {
        if (res) {
          this.coinbaseProvider.logout();
          this.navCtrl.popToRoot();
        }
      });
  }

  public goToCoinbase() {
    this.navCtrl.push(CoinbasePage, { animate: false }).then(() => {
      const previousView = this.navCtrl.getPrevious();
      this.navCtrl.removeView(previousView);
    });
  }
}
