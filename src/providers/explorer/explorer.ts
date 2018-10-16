import { Injectable } from '@angular/core';
import { Logger } from '../../providers/logger/logger';

// providers
import { HomeIntegrationsProvider } from '../home-integrations/home-integrations';

@Injectable()
export class ExplorerProvider {
  private credentials;

  constructor(
    private homeIntegrationsProvider: HomeIntegrationsProvider,
    private logger: Logger,
  ) {
    this.logger.info('Hello ExplorerProvider Provider');
    this.credentials = {};
  }

  public getNetwork() {
    return this.credentials.NETWORK;
  }

  public register(): void {
    this.homeIntegrationsProvider.register({
      name: 'explorer',
      title: 'Testnet Explorer',
      icon: 'assets/img/shapeshift/icon-shapeshift.svg',
      page: 'ExplorerPage',
      show: true
    });
  }
}
