import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import env from '../../environments';
import { CoinsMap, CurrencyProvider } from '../../providers/currency/currency';
import { Logger } from '../../providers/logger/logger';

@Injectable()
export class RateProvider {
  private alternatives;
  private rates = {} as CoinsMap<{}>;
  private ratesAvailable = {} as CoinsMap<boolean>;
  private rateServiceUrl = {} as CoinsMap<string>;

  private fiatRateAPIUrl = 'https://bws.bitpay.com/bws/api/v1/fiatrates';

  constructor(
    private currencyProvider: CurrencyProvider,
    private http: HttpClient,
    private logger: Logger
  ) {
    this.logger.debug('RateProvider initialized');
    this.alternatives = [];
    for (const coin of this.currencyProvider.getAvailableCoins()) {
      this.rateServiceUrl[coin] = env.ratesAPI[coin];
      this.rates[coin] = { USD: 1 };
      this.ratesAvailable[coin] = false;
      this.updateRates(coin);
    }
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

  public toFiat(satoshis: number, code: string, chain): number {
    if (!this.isCoinAvailable(chain)) {
      return null;
    }
    return (
      satoshis *
      (1 / this.currencyProvider.getPrecision(chain).unitToSatoshi) *
      this.getRate(code, chain)
    );
  }

  public fromFiat(amount: number, code: string, chain): number {
    if (!this.isCoinAvailable(chain)) {
      return null;
    }
    return (
      (amount / this.getRate(code, chain)) *
      this.currencyProvider.getPrecision(chain).unitToSatoshi
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
