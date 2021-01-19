import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import * as moment from 'moment';
import env from '../../environments';
import { ConfigProvider } from '../../providers/config/config';
import { CoinsMap, CurrencyProvider } from '../../providers/currency/currency';
import { Logger } from '../../providers/logger/logger';

const EXPIRATION_TIME_MS = 5 * 60 * 1000; // 5min

export interface ExchangeRate {
  rate: number;
  ts: number;
}

export enum DateRanges {
  Day = 1,
  Week = 7,
  Month = 30
}

export interface HistoricalRates {
  btc: ExchangeRate[];
  bch: ExchangeRate[];
}

@Injectable()
export class RateProvider {
  private alternatives;
  private rates = {} as CoinsMap<{}>;
  private ratesAvailable = {} as CoinsMap<boolean>;
  private rateServiceUrl = {} as CoinsMap<string>;

  private bwsURL: string;
  private ratesCache: any;

  constructor(
    private currencyProvider: CurrencyProvider,
    private http: HttpClient,
    private logger: Logger,
    private configProvider: ConfigProvider
  ) {
    this.logger.debug('RateProvider initialized');
    this.alternatives = {};
    for (const coin of this.currencyProvider.getAvailableCoins()) {
      this.rateServiceUrl[coin] = env.ratesAPI[coin];
      this.rates[coin] = { USD: 1 };
      this.ratesAvailable[coin] = false;
      this.updateRates(coin);
    }

    const defaults = this.configProvider.getDefaults();
    this.bwsURL = defaults.bws.url;
    this.ratesCache = {
      1: [],
      7: [],
      30: []
    };
  }

  public updateRates(chain: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getCoin(chain)
        .then(dataCoin => {
          _.each(dataCoin, currency => {
            if (currency && currency.code && currency.rate) {
              this.rates[chain][currency.code] = currency.rate;
              if (currency.name)
                this.alternatives[currency.code] = { name: currency.name };
            }
          });
          this.ratesAvailable[chain] = true;
          resolve();
        })
        .catch(errorCoin => {
          this.logger.error(errorCoin);
          reject(errorCoin);
        });
    });
  }

  public getCoin(chain: string): Promise<any> {
    return new Promise(resolve => {
      this.http.get(this.rateServiceUrl[chain]).subscribe(data => {
        resolve(data);
      });
    });
  }

  public getRate(code: string, chain?: string, opts?: { rates? }): number {
    const customRate =
      opts && opts.rates && opts.rates[chain] && opts.rates[chain][code];
    if (customRate) return customRate;
    if (this.rates[chain][code]) return this.rates[chain][code];
    if (
      !this.rates[chain][code] &&
      this.rates[chain]['USD'] &&
      this.rates['btc'][code] &&
      this.rates['btc']['USD'] &&
      this.rates['btc']['USD'] > 0
    ) {
      const newRate = +(
        (this.rates[chain]['USD'] * this.rates['btc'][code]) /
        this.rates['btc']['USD']
      ).toFixed(2);
      return newRate;
    }
    this.logger.warn(
      'There are no rates for chain: ' + chain + ' - code: ' + code
    );
    return undefined;
  }

  private getAlternatives(): any[] {
    const alternatives: any[] = [];
    for (let key in this.alternatives) {
      alternatives.push({ isoCode: key, name: this.alternatives[key].name });
    }
    return alternatives;
  }

  public isCoinAvailable(chain: string) {
    return this.ratesAvailable[chain];
  }

  public isAltCurrencyAvailable(currency: string) {
    if (_.isEmpty(this.alternatives)) return true;
    return this.alternatives[currency];
  }

  public toFiat(
    satoshis: number,
    code: string,
    chain,
    opts?: { customRate?: number; rates? }
  ): number {
    if (!this.isCoinAvailable(chain)) {
      return null;
    }
    const customRate = opts && opts.customRate;
    const rate = customRate || this.getRate(code, chain, opts);
    return (
      satoshis *
      (1 / this.currencyProvider.getPrecision(chain).unitToSatoshi) *
      rate
    );
  }

  public fromFiat(
    amount: number,
    code: string,
    chain,
    opts?: { rates? }
  ): number {
    if (!this.isCoinAvailable(chain)) {
      return null;
    }
    return (
      (amount / this.getRate(code, chain, opts)) *
      this.currencyProvider.getPrecision(chain).unitToSatoshi
    );
  }

  public listAlternatives(sort: boolean) {
    const alternatives = this.getAlternatives();
    if (sort) {
      alternatives.sort((a, b) => {
        return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1;
      });
    }
    return _.uniqBy(alternatives, 'isoCode');
  }

  public whenRatesAvailable(chain: string): Promise<any> {
    return new Promise(resolve => {
      if (this.ratesAvailable[chain]) resolve();
      else {
        if (chain) {
          this.updateRates(chain).then(() => {
            resolve();
          });
        }
      }
    });
  }

  public getHistoricFiatRate(
    currency: string,
    coin: string,
    ts: string
  ): Promise<any> {
    return new Promise(resolve => {
      const url = `${this.bwsURL}/v1/fiatrates/${currency}?coin=${coin}&ts=${ts}`;
      this.http.get(url).subscribe(data => {
        resolve(data);
      });
    });
  }

  public getLastDayRates(): Promise<HistoricalRates> {
    const fiatIsoCode =
      this.configProvider.get().wallet.settings.alternativeIsoCode || 'USD';

    return this.fetchHistoricalRates(fiatIsoCode, DateRanges.Day).then(x => {
      let ret = {};
      _.map(x, (v, k) => {
        ret[k] = _.last(v).rate;
      });
      return ret as HistoricalRates;
    });
  }

  public fetchHistoricalRates(
    fiatIsoCode: string,
    dateRange: DateRanges = DateRanges.Day
  ): Promise<HistoricalRates> {
    const firstDateTs =
      moment().subtract(dateRange, 'days').startOf('hour').unix() * 1000;

    const now = Date.now();
    if (
      _.isEmpty(this.ratesCache[dateRange].data) ||
      this.ratesCache[dateRange].expiration < now
    ) {
      this.logger.debug(
        `Refreshing Exchange rates for ${fiatIsoCode} period ${dateRange}`
      );

      // This pulls ALL coins in one query
      const req = this.http.get<ExchangeRate[]>(
        `${this.bwsURL}/v2/fiatrates/${fiatIsoCode}?ts=${firstDateTs}`
      );

      this.ratesCache[dateRange].data = req.first().toPromise();
      this.ratesCache[dateRange].expiration = now + EXPIRATION_TIME_MS;
    }
    return this.ratesCache[dateRange].data;
  }
}
