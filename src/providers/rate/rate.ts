import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import env from '../../environments';
import { Logger } from '../../providers/logger/logger';

@Injectable()
export class RateProvider {
  private rates;
  private alternatives;
  private ratesBCH;
  private ratesETH;
  private ratesBtcAvailable: boolean;
  private ratesBchAvailable: boolean;
  private ratesEthAvailable: boolean;

  private SAT_TO_BTC: number;
  private SAT_TO_ETH: number;
  private BTC_TO_SAT: number;
  private ETH_TO_SAT: number;

  private rateServiceUrl = env.ratesAPI.btc;
  private bchRateServiceUrl = env.ratesAPI.bch;
  private ethRateServiceUrl = env.ratesAPI.eth;

  constructor(private http: HttpClient, private logger: Logger) {
    this.logger.debug('RateProvider initialized');
    this.rates = {};
    this.alternatives = [];
    this.ratesBCH = {};
    this.ratesETH = {};
    this.SAT_TO_BTC = 1 / 1e8;
    this.SAT_TO_ETH = 1 / 1e18;
    this.BTC_TO_SAT = 1e8;
    this.ETH_TO_SAT = 1e18;
    this.ratesBtcAvailable = false;
    this.ratesBchAvailable = false;
    this.ratesEthAvailable = false;
    this.updateRatesBtc();
    this.updateRatesBch();
    this.updateRatesEth();
  }

  public updateRatesBtc(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getBTC()
        .then(dataBTC => {
          _.each(dataBTC, currency => {
            this.rates[currency.code] = currency.rate;
            this.alternatives.push({
              name: currency.name,
              isoCode: currency.code,
              rate: currency.rate
            });
          });
          this.ratesBtcAvailable = true;
          resolve();
        })
        .catch(errorBTC => {
          this.logger.error(errorBTC);
          reject(errorBTC);
        });
    });
  }

  public updateRatesBch(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getBCH()
        .then(dataBCH => {
          _.each(dataBCH, currency => {
            this.ratesBCH[currency.code] = currency.rate;
          });
          this.ratesBchAvailable = true;
          resolve();
        })
        .catch(errorBCH => {
          this.logger.error(errorBCH);
          reject(errorBCH);
        });
    });
  }


  public updateRatesEth(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getETH()
        .then(dataETH => {
          _.each(dataETH, currency => {
            this.ratesETH[currency.code] = currency.rate;
          });
          this.ratesEthAvailable = true;
          resolve();
        })
        .catch(errorETH => {
          this.logger.error(errorETH);
          reject(errorETH);
        });
    });
  }

  public getBTC(): Promise<any> {
    return new Promise(resolve => {
      this.http.get(this.rateServiceUrl).subscribe(data => {
        resolve(data);
      });
    });
  }

  public getBCH(): Promise<any> {
    return new Promise(resolve => {
      this.http.get(this.bchRateServiceUrl).subscribe(data => {
        resolve(data);
      });
    });
  }

  public getETH(): Promise<any> {
    return new Promise(resolve => {
      this.http.get(this.ethRateServiceUrl).subscribe(data => {
        resolve(data);
      });
    });
  }

  public getRate(code: string, chain?: string): number {
    if (chain === 'eth') return this.ratesETH[code];
    else if (chain == 'bch') return this.ratesBCH[code];
    else return this.rates[code];
  }

  public getAlternatives() {
    return this.alternatives;
  }

  public isBtcAvailable() {
    return this.ratesBtcAvailable;
  }

  public isBchAvailable() {
    return this.ratesBchAvailable;
  }

  public isEthAvailable() {
    return this.ratesEthAvailable;
  }

  public toFiat(satoshis: number, code: string, chain: string): number {
    if (
      (!this.isBtcAvailable() && chain == 'btc') ||
      (!this.isBchAvailable() && chain == 'bch') ||
      (!this.isEthAvailable() && chain == 'eth')
    ) {
      return null;
    }
    if (chain === 'eth') return satoshis * this.SAT_TO_ETH * this.getRate(code, chain);
    else return satoshis * this.SAT_TO_BTC * this.getRate(code, chain);
  }

  public fromFiat(amount: number, code: string, chain: string): number {
    if (
      (!this.isBtcAvailable() && chain == 'btc') ||
      (!this.isBchAvailable() && chain == 'bch') ||
      (!this.isEthAvailable() && chain == 'eth')
    ) {
      return null;
    }
    if (chain === 'eth') return (amount / this.getRate(code, chain)) * this.ETH_TO_SAT;
    else return (amount / this.getRate(code, chain)) * this.BTC_TO_SAT;
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
      if (
        (this.ratesBtcAvailable && chain == 'btc') ||
        (this.ratesBchAvailable && chain == 'bch') ||
        (this.ratesEthAvailable && chain == 'eth')
      )
        resolve();
      else {
        if (chain == 'btc') {
          this.updateRatesBtc().then(() => {
            resolve();
          });
        }
        if (chain == 'bch') {
          this.updateRatesBch().then(() => {
            resolve();
          });
        }
        if (chain == 'eth') {
          this.updateRatesEth().then(() => {
            resolve();
          });
        }
      }
    });
  }
}
