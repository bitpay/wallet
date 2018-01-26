import { Component } from '@angular/core';
import { Logger } from '../../../providers/logger/logger';

//providers
import { ConfigProvider } from '../../../providers/config/config';
import { HomeIntegrationsProvider } from '../../../providers/home-integrations/home-integrations';

import * as _ from 'lodash';

@Component({
  selector: 'page-advanced',
  templateUrl: 'advanced.html',
})
export class AdvancedPage {

  public spendUnconfirmed: boolean;
  public recentTransactionsEnabled: boolean;
  public showIntegrations: boolean;
  public showIntegration: any;
  public useLegacyAddress: boolean;
  public homeIntegrations: any;

  constructor(
    private configProvider: ConfigProvider,
    private logger: Logger,
    private homeIntegrationsProvider: HomeIntegrationsProvider
  ) {
    this.homeIntegrations = this.homeIntegrationsProvider.get();
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad AdvancedPage');
  }

  ionViewWillEnter() {
    let config = this.configProvider.get();

    this.spendUnconfirmed = config.wallet.spendUnconfirmed;
    this.recentTransactionsEnabled = config.recentTransactions.enabled;
    this.useLegacyAddress = config.wallet.useLegacyAddress;
    this.showIntegrations = config.showIntegrations.enabled;
    this.showIntegration = config.showIntegration;
    this.homeIntegrations.forEach((integration: any) => {
      integration.show = this.showIntegration[integration.name];
    });
  }

  public spendUnconfirmedChange(): void {
    let opts = {
      wallet: {
        spendUnconfirmed: this.spendUnconfirmed
      }
    };
    this.configProvider.set(opts);
  }

  public recentTransactionsChange(): void {
    let opts = {
      recentTransactions: {
        enabled: this.recentTransactionsEnabled
      }
    };
    this.configProvider.set(opts);
  }

  public useLegacyAddressChange(): void {
    let opts = {
      wallet: {
        useLegacyAddress: this.useLegacyAddress
      }
    };
    this.configProvider.set(opts);
  }

  public integrationsChange(): void {
    let opts = {
      showIntegrations: {
        enabled: this.showIntegrations
      },
    };
    this.configProvider.set(opts);
  }

  public integrationChange(integrationName): void {
    this.showIntegration[integrationName] = !this.showIntegration[integrationName];
    let opts = {
      showIntegration: this.showIntegration,
    };
    this.configProvider.set(opts);
  }
}
