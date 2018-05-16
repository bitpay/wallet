import { Component } from '@angular/core';
import { NavParams } from 'ionic-angular';
import * as _ from 'lodash';

// Providers
import { ConfigProvider } from '../../../../providers/config/config';
import { ExternalLinkProvider } from '../../../../providers/external-link/external-link';
import { HomeIntegrationsProvider } from '../../../../providers/home-integrations/home-integrations';

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
    private externalLinkProvider: ExternalLinkProvider,
    private homeIntegrationsProvider: HomeIntegrationsProvider,
    private navParams: NavParams
  ) {
    // Possible countries: usa, japan
    switch (this.navParams.data.country) {
      case 'japan':
        this.country = 'japan';
        this.serviceName = 'amazonJapan';
        this.pageTitle = 'Amazon.co.jp ギフト券';
        break;
      default:
        this.country = 'usa';
        this.serviceName = 'amazon';
        this.pageTitle = 'Amazon.com Gift Cards';
        break;
    }

    this.service = _.filter(this.homeIntegrationsProvider.get(), {
      name: this.serviceName
    });
    this.showInHome = !!this.service[0].show;
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
