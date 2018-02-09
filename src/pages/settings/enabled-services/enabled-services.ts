import { Component } from '@angular/core';
import { Logger } from '../../../providers/logger/logger';
import * as _ from 'lodash';

// Providers
import { ConfigProvider } from '../../../providers/config/config';
import { HomeIntegrationsProvider } from '../../../providers/home-integrations/home-integrations';

@Component({
  selector: 'page-enabled-services',
  templateUrl: 'enabled-services.html',
})
export class EnabledServicesPage {

  public showIntegration: any;
  public useLegacyAddress: boolean;
  public homeIntegrations: any;

  constructor(
    private logger: Logger,
    private configProvider: ConfigProvider,
    private homeIntegrationsProvider: HomeIntegrationsProvider
  ) {
    let config: any = this.configProvider.get();
    this.showIntegration = config.showIntegration;
    this.homeIntegrations = this.homeIntegrationsProvider.get();
    this.homeIntegrations.forEach((integration: any) => {
      integration.show = this.showIntegration[integration.name];
    });
  }

  public integrationChange(integrationName): void {
    this.showIntegration[integrationName] = !this.showIntegration[integrationName];
    let opts = {
      showIntegration: this.showIntegration,
    };
    this.configProvider.set(opts);
  }
}
