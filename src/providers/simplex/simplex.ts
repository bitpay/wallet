import { Injectable } from '@angular/core';

// providers
import { AppProvider } from '../app/app';
import { ConfigProvider } from '../config/config';
import { HomeIntegrationsProvider } from '../home-integrations/home-integrations';
import { HttpRequestsProvider } from '../http-requests/http-requests';
import { Logger } from '../logger/logger';

@Injectable()
export class SimplexProvider {
  private credentials;

  constructor(
    private appProvider: AppProvider,
    private homeIntegrationsProvider: HomeIntegrationsProvider,
    private httpRequestProvider: HttpRequestsProvider,
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
      this.credentials.WALLET_ID = simplex.sandbox.wallet_id; // Partner name
    } else {
      this.credentials.REDIRECT_URI = simplex.production.redirect_uri;
      this.credentials.HOST = simplex.production.host;
      this.credentials.API = simplex.production.api;
      this.credentials.API_KEY = simplex.production.api_key || null;
      this.credentials.WALLET_ID = simplex.production.wallet_id; // Partner name
    }
  }

  public getNetwork(): string {
    return this.credentials.NETWORK;
  }

  public getPartnerName(): string {
    return this.credentials.WALLET_ID;
  }

  public getAPI(): string {
    return this.credentials.API;
  }

  public getStatus(addr: string, token: string, cb) {
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: 'Bearer ' + token
    };
    this.httpRequestProvider
      .get(this.credentials.API_URL + '/txStat/' + addr, null, headers)
      .subscribe(
      data => {
        this.logger.info('Simplex STATUS: SUCCESS');
        return cb(null, data);
      },
      data => {
        const error = this.parseError(data);
        this.logger.error('Simplex STATUS ERROR: ' + error);
        return cb(data.error);
      }
      );
  }

  public testSimplex(opts): Promise<any> {
    return new Promise((resolve, reject) => {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'ApiKey ' + this.credentials.API_KEY
      };

      this.httpRequestProvider
        .post(this.credentials.API + '/wallet/merchant/v2/quote', opts, headers)
        .subscribe(
        data => {
          return resolve(data);
        },
        err => {
          return reject(err);
        });
    });
  }

  public paymentRequest(opts): Promise<any> {
    return new Promise((resolve, reject) => {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'ApiKey ' + this.credentials.API_KEY
      };

      this.httpRequestProvider
        .post(this.credentials.API + '/wallet/merchant/v2/payments/partner/data', opts, headers)
        .subscribe(
        data => {
          return resolve(data);
        },
        err => {
          return reject(err);
        });
    });
  }

  public paymentFormSubmission(body: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.httpRequestProvider
        .post(this.credentials.API + '/payments/new', body)
        .subscribe(
        data => {
          return resolve(data);
        },
        err => {
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
      show: !!this.configProvider.get().showIntegration['simplex'],
      linked: true
    });
  }

  private parseError(err: any): string {
    if (!err) return 'Unknow Error';
    if (!err.error) return err.message ? err.message : 'Unknow Error';

    const parsedError = err.error.error_description
      ? err.error.error_description
      : err.error.error && err.error.error.message
        ? err.error.error.message
        : err.error;
    return parsedError;
  }
}
