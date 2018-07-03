import { Component } from '@angular/core';
import * as _ from 'lodash';

// Providers
import { AmazonProvider } from '../../../../providers/amazon/amazon';
import { ConfigProvider } from '../../../../providers/config/config';
import { ExternalLinkProvider } from '../../../../providers/external-link/external-link';
import { HomeIntegrationsProvider } from '../../../../providers/home-integrations/home-integrations';
import { Logger } from '../../../../providers/logger/logger';
import { OnGoingProcessProvider } from '../../../../providers/on-going-process/on-going-process';

@Component({
  selector: 'page-amazon-settings',
  templateUrl: 'amazon-settings.html'
})
export class AmazonSettingsPage {
  private serviceName: string = 'amazon';
  public country: string;
  public pageTitle: string;
  public showInHome: boolean;
  public service;

  constructor(
    private configProvider: ConfigProvider,
    private logger: Logger,
    private externalLinkProvider: ExternalLinkProvider,
    private homeIntegrationsProvider: HomeIntegrationsProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private amazonProvider: AmazonProvider
  ) {
    this.serviceName = 'amazon';
    this.service = _.filter(this.homeIntegrationsProvider.get(), {
      name: this.serviceName
    });
    this.showInHome = !!this.service[0].show;
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad AmazonSettingsPage');
    this.initialize();
  }

  private async initialize() {
    if (!this.amazonProvider.currency) {
      this.onGoingProcessProvider.set('');
      await this.amazonProvider.setCurrencyByLocation();
      this.onGoingProcessProvider.clear();
    }
    this.country = this.amazonProvider.country;
    this.pageTitle = this.amazonProvider.pageTitle;
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

  public openExternalLink(url: string) {
    this.externalLinkProvider.open(url);
  }
}
