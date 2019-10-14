import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import env from '../../environments';
import { CoinOpts, ConfigProvider } from '../../providers/config/config';
import { Logger } from '../../providers/logger/logger';

export interface RatesObj {
  btc: {};
  bch: {};
  eth: {};
}

export interface RatesAvailable {
  btc: boolean;
  bch: boolean;
  eth: boolean;
}

@Injectable()
export class RateProvider {
  private rates: RatesObj;
  private alternatives;
  private ratesAvailable: RatesAvailable;
  private coinOpts: CoinOpts;

  private rateServiceUrl = {
    btc: env.ratesAPI.btc,
    bch: env.ratesAPI.bch,
    eth: env.ratesAPI.eth
  };
  private fiatRateAPIUrl = 'https://bws.bitpay.com/bws/api/v1/fiatrates';

  constructor(
    private configProvider: ConfigProvider,
    private http: HttpClient,
    private logger: Logger
  ) {
    this.logger.debug('RateProvider initialized');
    this.rates = {
      btc: {},
      bch: {},
      eth: {}
    };
    this.alternatives = [];
    this.coinOpts = this.configProvider.getCoinOpts();
    this.ratesAvailable = {
      btc: false,
      bch: false,
      eth: false
    };
    this.updateRates('btc');
    this.updateRates('bch');
    this.updateRates('eth');
  }

  public updateRates(chain: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getCoin(chain)
        .then(dataCoin => {
          _.each(dataCoin, currency => {
            this.rates[chain][currency.code] = currency.rate;
            this.alternatives.push({
              name: currency.name,
              isoCode: currency.code,
              rate: currency.rate
            });
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

  public getRate(code: string, chain?: string): number {
    return this.rates[chain][code];
  }

  public getAlternatives() {
    return this.alternatives;
  }

  public isCoinAvailable(chain: string) {
    return this.ratesAvailable[chain];
  }

  public toFiat(satoshis: number, code: string, chain: string): number {
    if (!this.isCoinAvailable(chain)) {
      return null;
    }
    return (
      satoshis *
      (1 / this.coinOpts[chain].unitToSatoshi) *
      this.getRate(code, chain)
    );
  }

  public fromFiat(amount: number, code: string, chain: string): number {
    if (!this.isCoinAvailable(chain)) {
      return null;
    }
    return (
      (amount / this.getRate(code, chain)) * this.coinOpts[chain].unitToSatoshi
    );
  }

  public listAlternatives(sort: boolean) {
    let alternatives = _.map(this.getAlternatives(), (item: any) => {
      return {
        name: item.name,
        isoCode: item.isoCode
      };
    });
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
      const url =
        this.fiatRateAPIUrl + '/' + currency + '?coin=' + coin + '&ts=' + ts;
      this.http.get(url).subscribe(data => {
        resolve(data);
      });
    });
  }
}
