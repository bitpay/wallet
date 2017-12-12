import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Logger } from '@nsalaun/ng-logger';
import * as _ from 'lodash';

@Injectable()
export class RateProvider {

  private rates: any;
  private alternatives: Array<any>;
  private ratesBCH: any;
  private ratesAvailable: boolean;

  private rateServiceUrl = 'https://bitpay.com/api/rates';
  private bchRateServiceUrl = 'https://api.kraken.com/0/public/Ticker?pair=BCHUSD,BCHEUR';

  constructor(
    private http: HttpClient,
    private logger: Logger
  ) {
    this.logger.info('RateProvider initialized.');
    this.rates = {};
    this.alternatives = [];
    this.ratesBCH = {};
    this.ratesAvailable = false;
    this.updateRatesBtc();
    this.updateRatesBch();
  }

  private updateRatesBtc(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getBTC().then((dataBTC: any) => {

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
      }).catch((errorBTC: any) => {
        this.logger.error(errorBTC);
        reject(errorBTC);
      });
    });
  }

  private updateRatesBch(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getBCH().then((dataBCH: any) => {
        _.each(dataBCH.result, (data: any, paircode: string) => {
          let code = paircode.substr(3, 3);
          let rate = data.c[0];
          this.ratesBCH[code] = rate;
        });
        resolve();
      }).catch((errorBCH: any) => {
        this.logger.error(errorBCH);
        reject(errorBCH);
      });
    });
  }

  private getBTC(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.get(this.rateServiceUrl).subscribe((data: any) => {
        resolve(data);
      });
    });
  }

  private getBCH(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.get(this.bchRateServiceUrl).subscribe((data: any) => {
        resolve(data);
      });
    });
  }

  private getRate(code: string, chain?: string): number {
    if (chain == 'bch')
      return this.ratesBCH[code];
    else
      return this.rates[code];
  }

  public getAlternatives(): Array<any> {
    return this.alternatives;
  }

  public toFiat(satoshis: number, code: string, chain: string): number {
    return satoshis * this.getRate(code, chain);
  }

  public fromFiat(amount: number, code: string, chain: string): number {
    return amount / this.getRate(code, chain);
  }

  public listAlternatives(sort: boolean) {
    let alternatives = _.map(this.getAlternatives(), (item: any) => {
      return {
        name: item.name,
        isoCode: item.isoCode
      }
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
