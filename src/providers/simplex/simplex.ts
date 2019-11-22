import { Injectable } from '@angular/core';

// providers
import { AppProvider } from '../app/app';
import { ConfigProvider } from '../config/config';
import { HomeIntegrationsProvider } from '../home-integrations/home-integrations';
import { Logger } from '../logger/logger';

@Injectable()
export class SimplexProvider {
  private credentials;

  constructor(
    private appProvider: AppProvider,
    private homeIntegrationsProvider: HomeIntegrationsProvider,
    private logger: Logger,
    private configProvider: ConfigProvider
  ) {
    this.logger.debug('SimplexProvider Provider initialized');
    this.credentials = {};
  }

  public setCredentials() {
    if (
      !this.appProvider.servicesInfo ||
      !this.appProvider.servicesInfo.simplex
    ) {
      return;
    }
    const simplex = this.appProvider.servicesInfo.simplex;
    /*
     * Development: 'testnet'
     * Production: 'livenet'
     */
    this.credentials.NETWORK = 'testnet';

    if (this.credentials.NETWORK === 'testnet') {
      this.credentials.REDIRECT_URI = simplex.sandbox.redirect_uri;
      this.credentials.HOST = simplex.sandbox.host;
      this.credentials.API = simplex.sandbox.api;
      this.credentials.API_KEY = simplex.sandbox.api_key || null;
      this.credentials.APP_PROVIDER_ID = simplex.sandbox.appProviderId; // Partner name
    } else {
      this.credentials.REDIRECT_URI = simplex.production.redirect_uri;
      this.credentials.HOST = simplex.production.host;
      this.credentials.API = simplex.production.api;
      this.credentials.API_KEY = simplex.production.api_key || null;
      this.credentials.APP_PROVIDER_ID = simplex.production.appProviderId; // Partner name
    }
  }

  public getNetwork(): string {
    return this.credentials.NETWORK;
  }

  public getPartnerId(): string {
    return this.credentials.APP_PROVIDER_ID;
  }

  public getAPI(): string {
    return this.credentials.API;
  }

  public getQuote(wallet, opts): Promise<any> {
    return new Promise((resolve, reject) => {
      wallet
        .simplexGetQuote(opts)
        .then(res => {
          return resolve(res.body);
        })
        .catch(err => {
          return reject(err);
        });
    });
  }

  public paymentRequest(wallet, opts): Promise<any> {
    return new Promise((resolve, reject) => {
      wallet
        .simplexPaymentRequest(opts)
        .then(res => {
          return resolve(res.body);
        })
        .catch(err => {
          return reject(err);
        });
    });
  }

  public register(): void {
    this.homeIntegrationsProvider.register({
      name: 'simplex',
      title: 'Simplex',
      icon: 'assets/img/simplex/icon-simplex.png',
      logo: 'assets/img/simplex/logo-simplex-light.png',
      background:
        'linear-gradient(to bottom,rgba(60, 63, 69, 1) 0,rgba(60, 63, 69, 1) 100%)',
      page: 'SimplexPage',
      show: !!this.configProvider.get().showIntegration['simplex']
    });
  }
}
