import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';

// providers
import env from '../../environments';
import { ConfigProvider } from '../config/config';
import { HomeIntegrationsProvider } from '../home-integrations/home-integrations';
import { Logger } from '../logger/logger';
import { PersistenceProvider } from '../persistence/persistence';

const PASSTHROUGH_URI_DEV = 'https://cmgustavo.github.io/website/simplex/';
const PASSTHROUGH_URI_PROD = 'https://bws.bitpay.com/static/simplex/';

@Injectable()
export class SimplexProvider {
  private env: string;
  public passthrough_uri: string;
  public supportedFiatAltCurrencies;
  public supportedCoins;

  constructor(
    private configProvider: ConfigProvider,
    private homeIntegrationsProvider: HomeIntegrationsProvider,
    private logger: Logger,
    private persistenceProvider: PersistenceProvider,
    private translate: TranslateService
  ) {
    this.logger.debug('SimplexProvider Provider initialized');
    this.env = env.name == 'development' ? 'sandbox' : 'production';
    this.passthrough_uri =
      env.name == 'development' ? PASSTHROUGH_URI_DEV : PASSTHROUGH_URI_PROD;
    this.supportedFiatAltCurrencies = [
      'AED',
      'ARS',
      'AUD',
      'AZN',
      'BGN',
      'BRL',
      'CAD',
      'CHF',
      'CLP',
      'CNY',
      'COP',
      'CRC',
      'CZK',
      'DKK',
      'DOP',
      'EUR',
      'GBP',
      'GEL',
      'HKD',
      'HUF',
      'ILS',
      'INR',
      'JPY',
      'KRW',
      'KZT',
      'MAD',
      'MDL',
      'MXN',
      'MYR',
      'NAD',
      'NGN',
      'NOK',
      'NZD',
      'PEN',
      'PHP',
      'PLN',
      'QAR',
      'RON',
      'RUB',
      'SEK',
      'SGD',
      'TRY',
      'TWD',
      'UAH',
      'USD',
      'UYU',
      'UZS',
      'VND',
      'ZAR'
    ];
    this.supportedCoins = ['btc', 'bch', 'eth', 'xrp', 'pax', 'busd'];
  }

  public getSupportedFiatAltCurrencies(): string[] {
    return this.supportedFiatAltCurrencies;
  }

  public getQuote(wallet, data): Promise<any> {
    data.env = this.env;
    return wallet.simplexGetQuote(data);
  }

  public paymentRequest(wallet, data): Promise<any> {
    data.env = this.env;
    return wallet.simplexPaymentRequest(data);
  }

  public getCheckoutUrl(): string {
    return env.name == 'development'
      ? 'https://sandbox.test-simplexcc.com'
      : 'https://checkout.simplexcc.com';
  }

  public getEvents(wallet): Promise<any> {
    let data: any = {};
    data.env = this.env;
    return wallet.simplexGetEvents(data);
  }

  public register(): void {
    this.homeIntegrationsProvider.register({
      name: 'simplex',
      title: this.translate.instant('Buy Crypto'),
      icon: 'assets/img/simplex/icon-simplex.png',
      showIcon: true,
      logo: 'assets/img/simplex/logo-simplex-color.svg',
      logoWidth: '110',
      background:
        'linear-gradient(to bottom,rgba(60, 63, 69, 1) 0,rgba(45, 47, 51, 1) 100%)',
      page: 'SimplexPage',
      show: !!this.configProvider.get().showIntegration['simplex'],
      type: 'exchange'
    });
  }

  public saveSimplex(data, opts): Promise<any> {
    const env = this.env;
    return this.persistenceProvider.getSimplex(env).then(oldData => {
      if (_.isString(oldData)) {
        oldData = JSON.parse(oldData);
      }
      if (_.isString(data)) {
        data = JSON.parse(data);
      }
      let inv = oldData ? oldData : {};
      inv[data.payment_id] = data;
      if (opts && (opts.error || opts.status)) {
        inv[data.payment_id] = _.assign(inv[data.payment_id], opts);
      }
      if (opts && opts.remove) {
        delete inv[data.payment_id];
      }

      inv = JSON.stringify(inv);

      this.persistenceProvider.setSimplex(env, inv);
      return Promise.resolve();
    });
  }

  public getSimplex(): Promise<any> {
    const env = this.env;
    return this.persistenceProvider.getSimplex(env);
  }
}
