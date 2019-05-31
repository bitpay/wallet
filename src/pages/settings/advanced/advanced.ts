import { Component } from '@angular/core';
import * as _ from 'lodash';

// providers
import {
  AppProvider,
  ConfigProvider,
  HomeIntegrationsProvider,
  Logger
} from '../../../providers';

@Component({
  selector: 'page-advanced',
  templateUrl: 'advanced.html'
})
export class AdvancedPage {
  public spendUnconfirmed: boolean;
  public isCopay: boolean;
  private serviceName: string = 'pricechart';
  public showAtHome;
  public service;
  public bitpayCard;

  constructor(
    private configProvider: ConfigProvider,
    private logger: Logger,
    private appProvider: AppProvider,
    private homeIntegrationsProvider: HomeIntegrationsProvider
  ) {
    this.isCopay = this.appProvider.info.name === 'copay';
    this.service = _.filter(this.homeIntegrationsProvider.get(), {
      name: this.serviceName
    });
    this.showAtHome = !!this.service[0].show;
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: AdvancedPage');
  }

  ionViewWillEnter() {
    let config = this.configProvider.get();

    this.spendUnconfirmed = config.wallet.spendUnconfirmed;
  }

  public spendUnconfirmedChange(): void {
    let opts = {
      wallet: {
        spendUnconfirmed: this.spendUnconfirmed
      }
    };
    this.configProvider.set(opts);
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
