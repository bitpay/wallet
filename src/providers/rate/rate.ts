import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import * as moment from 'moment';
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
  public alternatives;
  private rates = {} as CoinsMap<{}>;
  private ratesAvailable = {} as CoinsMap<boolean>;
  private rateServiceUrl: string[] = [];

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
    for (const chain of this.currencyProvider.getAvailableCoins()) {
      this.rateServiceUrl[chain] = this.currencyProvider.getRatesApi()[chain];
      this.rates[chain] = { USD: 1 };
      // this.rates[chain] = this.currencyProvider.isCustomERCToken(chain)
      //   ? { USD: 0 }
      //   : { USD: 1 };
      this.ratesAvailable[chain] = false;
    }
    for (const token of this.currencyProvider.getAvailableTokens()) {
      this.rateServiceUrl[
        token.tokenInfo.symbol.toLowerCase()
      ] = this.currencyProvider.getTokenRatesApi(token.tokenInfo.symbol);
      this.ratesAvailable[token.tokenInfo.symbol.toLowerCase()] = false;
      this.rates[token.tokenInfo.symbol.toLowerCase()] = { USD: 1 };
    }
    const defaults = this.configProvider.getDefaults();
    this.bwsURL = defaults.bws.url;
    this.ratesCache = {
      1: [],
      7: [],
      30: []
    };
    this.updateRates();
  }

  public updateRates(chain?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (chain) {
        this.getCoin(chain)
          .then(dataCoin => {
            _.each(dataCoin, currency => {
              if (currency && currency.code && currency.rate) {
                this.rates[chain][currency.code] = currency.rate;
              }
            });
            resolve();
          })
          .catch(errorCoin => {
            this.logger.error(errorCoin);
            reject(errorCoin);
          });
      } else {
        this.getRates()
          .then(res => {
            _.map(res, (rates, coin) => {
              const coinRates = {};
              _.each(rates, r => {
                if (r.code && r.rate) {
                  const rate = { [r.code]: r.rate };
                  Object.assign(coinRates, rate);
                }

                // set alternative currency list
                if (r.code && r.name) {
                  this.alternatives[r.code] = { name: r.name };
                }
              });
              // FIX!!!!
              this.rates[coin] = !_.isEmpty(coinRates) ? coinRates : { USD: 1 };
              this.ratesAvailable[coin] = true;
            });
            resolve();
          })
          .catch(err => {
            this.logger.error(err);
            reject(err);
          });
      }
    });
  }

  public getRates(): Promise<any> {
    return new Promise(resolve => {
      this.http.get(`${this.bwsURL}/v3/fiatrates/`).subscribe(res => {
        resolve(res);
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

  public getRate(
    code: string,
    chain_or_tokensymbol: string,
    opts?: { rates? }
  ): number {
    const customRate =
      opts &&
      opts.rates &&
      opts.rates[chain_or_tokensymbol] &&
      opts.rates[chain_or_tokensymbol][code];
    if (customRate) return customRate;
    if (this.rates[chain_or_tokensymbol][code])
      return this.rates[chain_or_tokensymbol][code];
    if (
      !this.rates[chain_or_tokensymbol][code] &&
      this.rates[chain_or_tokensymbol]['USD'] &&
      this.rates['btc'][code] &&
      this.rates['btc']['USD'] &&
      this.rates['btc']['USD'] > 0
    ) {
      const newRate = +(
        (this.rates[chain_or_tokensymbol]['USD'] * this.rates['btc'][code]) /
        this.rates['btc']['USD']
      ).toFixed(2);
      return newRate;
    }
    this.logger.warn(
      'There are no rates for coin: ' +
        chain_or_tokensymbol +
        ' - code: ' +
        code
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

  public isCoinRateAvailable(chain_or_tokensymbol: string) {
    return this.ratesAvailable[chain_or_tokensymbol];
  }

  public isAltCurrencyAvailable(currency: string) {
    return this.alternatives[currency];
  }

  // INCREASE TESTINGS!!!
  // Testing related to tokens
  public toFiat(
    satoshis: number,
    code: string,
    chain,
    tokenAddress: string,
    opts?: { customRate?: number; rates? }
  ): number {
    if (!this.isCoinRateAvailable(chain)) {
      return null;
    }
    const customRate = opts && opts.customRate;
    const rate = customRate || this.getRate(code, chain, opts);
    const unitToSatoshi = tokenAddress
      ? this.currencyProvider.getTokenPrecision(tokenAddress).unitToSatoshi
      : this.currencyProvider.getPrecision(chain).unitToSatoshi;
    return satoshis * (1 / unitToSatoshi) * rate;
  }

  public fromFiat(
    amount: number,
    code: string,
    chain_or_tokensymbol,
    tokenAddress,
    opts?: { rates? }
  ): number {
    if (!this.isCoinRateAvailable(chain_or_tokensymbol)) {
      return null;
    }
    return (
      (amount / this.getRate(code, chain_or_tokensymbol, opts)) *
      (tokenAddress
        ? this.currencyProvider.getTokenPrecision(tokenAddress).unitToSatoshi
        : this.currencyProvider.getPrecision(chain_or_tokensymbol)
            .unitToSatoshi)
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

  public whenRatesAvailable(coin: string): Promise<any> {
    return new Promise(resolve => {
      if (this.ratesAvailable[coin.toLowerCase()]) resolve();
      else {
        if (coin) {
          this.updateRates(coin.toLowerCase()).then(() => {
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

  // Get chain rates [bch, btc, doge, eth, xrp]
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
