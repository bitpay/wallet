import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import env from '../../environments';
import { Logger } from '../../providers/logger/logger';

@Injectable()
export class RateProvider {
  private rates: any;
  private alternatives: any[];
  private ratesBCH: any;
  private ratesAvailable: boolean;

  private SAT_TO_BTC: number;
  private BTC_TO_SAT: number;

  private rateServiceUrl = env.ratesAPI.btc;
  private bchRateServiceUrl = env.ratesAPI.bch;

  constructor(private http: HttpClient, private logger: Logger) {
    this.logger.info('RateProvider initialized.');
    this.rates = {};
    this.alternatives = [];
    this.ratesBCH = {};
    this.SAT_TO_BTC = 1 / 1e8;
    this.BTC_TO_SAT = 1e8;
    this.ratesAvailable = false;
    this.updateRatesBtc();
    this.updateRatesBch();
  }

  public updateRatesBtc(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getBTC()
        .then((dataBTC: any) => {
          _.each(dataBTC, (currency: any) => {
            this.rates[currency.code] = currency.rate;
            this.alternatives.push({
              name: currency.name,
              isoCode: currency.code,
              rate: currency.rate
            });
          });
          this.ratesAvailable = true;
          resolve();
        })
        .catch((errorBTC: any) => {
          this.logger.error(errorBTC);
          reject(errorBTC);
        });
    });
  }

  public updateRatesBch(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getBCH()
        .then((dataBCH: any) => {
          _.each(dataBCH, (currency: any) => {
            this.ratesBCH[currency.code] = currency.rate;
          });
          resolve();
        })
        .catch((errorBCH: any) => {
          this.logger.error(errorBCH);
          reject(errorBCH);
        });
    });
  }

  public getBTC(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.get(this.rateServiceUrl).subscribe((data: any) => {
        resolve(data);
      });
    });
  }

  public getBCH(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.get(this.bchRateServiceUrl).subscribe((data: any) => {
        resolve(data);
      });
    });
  }

  public getRate(code: string, chain?: string): number {
    if (chain == 'bch') return this.ratesBCH[code];
    else return this.rates[code];
  }

  public getAlternatives(): any[] {
    return this.alternatives;
  }

  public isAvailable() {
    return this.ratesAvailable;
  }

  public toFiat(satoshis: number, code: string, chain: string): number {
    if (!this.isAvailable()) {
      return null;
    }
    return satoshis * this.SAT_TO_BTC * this.getRate(code, chain);
  }

  public fromFiat(amount: number, code: string, chain: string): number {
    if (!this.isAvailable()) {
      return null;
    }
    return amount / this.getRate(code, chain) * this.BTC_TO_SAT;
  }

  public listAlternatives(sort: boolean) {
    let alternatives = _.map(this.getAlternatives(), (item: any) => {
      return {
        name: item.name,
        isoCode: item.isoCode
      };
    });
    if (sort) {
      alternatives.sort((a: any, b: any) => {
        return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1;
      });
    }
    return _.uniqBy(alternatives, 'isoCode');
  }

  public whenRatesAvailable(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.ratesAvailable) resolve();
      else {
        this.updateRatesBtc().then(() => {
          resolve();
        });
      }
    });
  }
}
