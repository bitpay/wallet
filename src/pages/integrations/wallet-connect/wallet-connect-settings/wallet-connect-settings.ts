import { Component } from '@angular/core';

// Providers
import {
  ConfigProvider,
  ExternalLinkProvider,
  HomeIntegrationsProvider
} from '../../../../providers';

import * as _ from 'lodash';
@Component({
  selector: 'page-wallet-connect-settings',
  templateUrl: 'wallet-connect-settings.html'
})
export class WalletConnectSettingsPage {
  private serviceName: string = 'walletConnect';
  public showInHome;
  public service;

  constructor(
    private externalLinkProvider: ExternalLinkProvider,
    private configProvider: ConfigProvider,
    private homeIntegrationsProvider: HomeIntegrationsProvider
  ) {
    this.service = _.filter(this.homeIntegrationsProvider.get(), {
      name: this.serviceName
    });
    this.showInHome = !!this.service[0].show;
  }

  public openExternalLink(url: string) {
    this.externalLinkProvider.open(url);
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
