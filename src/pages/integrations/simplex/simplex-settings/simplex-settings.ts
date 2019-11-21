import { Component } from '@angular/core';
import { StatusBar } from '@ionic-native/status-bar';
import { Platform } from 'ionic-angular';

import * as _ from 'lodash';

// Providers
import { ConfigProvider } from '../../../../providers/config/config';
import { HomeIntegrationsProvider } from '../../../../providers/home-integrations/home-integrations';

@Component({
  selector: 'page-simplex-settings',
  templateUrl: 'simplex-settings.html'
})
export class SimplexSettingsPage {
  private serviceName: string = 'simplex';

  public showInHome;
  public service;
  public headerColor: string;

  constructor(
    private platform: Platform,
    private statusBar: StatusBar,
    private configProvider: ConfigProvider,
    private homeIntegrationsProvider: HomeIntegrationsProvider,
  ) {
    this.service = _.filter(this.homeIntegrationsProvider.get(), {
      name: this.serviceName
    });
    this.showInHome = !!this.service[0].show;
    this.headerColor = 'rgba(60, 63, 69, 1)';
  }

  ionViewWillEnter() {
    if (this.platform.is('cordova')) {
      this.statusBar.styleBlackOpaque();
    }
  }

  ionViewWillLeave() {
    if (this.platform.is('cordova')) {
      this.statusBar.styleDefault();
    }
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
