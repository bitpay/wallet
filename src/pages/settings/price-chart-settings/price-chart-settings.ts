import { Component } from '@angular/core';
import * as _ from 'lodash';

import { ConfigProvider, HomeIntegrationsProvider } from '../../../providers';

@Component({
  selector: 'price-chart-settings-page',
  templateUrl: 'price-chart-settings.html'
})
export class PriceChartSettingsPage {
  private serviceName: string = 'pricechart';
  public showAtHome;
  public service;
  public bitpayCard;

  constructor(
    private configProvider: ConfigProvider,
    private homeIntegrationsProvider: HomeIntegrationsProvider
  ) {
    this.service = _.filter(this.homeIntegrationsProvider.get(), {
      name: this.serviceName
    });
    this.showAtHome = !!this.service[0].show;
  }

  public integrationChange(): void {
    let opts = {
      showIntegration: { [this.serviceName]: this.showAtHome }
    };
    this.homeIntegrationsProvider.updateConfig(
      this.serviceName,
      this.showAtHome
    );
    this.configProvider.set(opts);
  }
}
