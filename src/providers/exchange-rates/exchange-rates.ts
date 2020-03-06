import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { Observable } from 'rxjs/Observable';
import { ConfigProvider, Logger } from '../../providers';

export interface ApiPrice {
  ts: number;
  rate: number;
  fetchedOn: number;
}

const dates = {
  24: 'hour',
  168: 'hour',
  31: 'day'
};
@Injectable()
export class ExchangeRatesProvider {
  public lastDates = 24;
  private bwsURL: string;
  private historicalDates: any[];
  private ratesCache = {};

  constructor(
    private httpClient: HttpClient,
    private logger: Logger,
    private configProvider: ConfigProvider
  ) {
    this.logger.debug('ExchangeRatesProvider initialized');
    const defaults = this.configProvider.getDefaults();
    this.bwsURL = defaults.bws.url;
  }

  public initializeCache(isoCoin, coin) {
    if (!this.ratesCache[isoCoin]) {
      this.ratesCache[isoCoin] = {};
    }
    if (!this.ratesCache[isoCoin][coin]) {
      this.ratesCache[isoCoin][coin] = {};
    }
  }

  public getHistoricalRates(isoCode, coin?): Observable<ApiPrice[]> {
    this.initializeCache(isoCode, coin);
    let observableBatch = [];
    this.historicalDates = [];
    this.setDates();

    if (this.ratesCache[isoCode][coin][this.lastDates]) {
      observableBatch = this.ratesCache[isoCode][coin][this.lastDates];
    } else {
      for (const date of this.historicalDates) {
        observableBatch.push(
          this.httpClient.get<ApiPrice>(
            `${this.bwsURL}/v1/fiatrates/${isoCode}?coin=${coin}&ts=${date}`
          )
        );
      }
      this.ratesCache[isoCode][coin][this.lastDates] = observableBatch;
    }
    return Observable.forkJoin(observableBatch);
  }

  public getCurrentRate(isoCode, coin?): Observable<ApiPrice> {
    return this.httpClient.get<ApiPrice>(
      `${this.bwsURL}/v1/fiatrates/${isoCode}?coin=${coin}`
    );
  }

  private setDates(): void {
    for (let i = 0; i <= this.lastDates; i++) {
      if (i == 0) {
        this.historicalDates.push(moment().unix() * 1000);
      } else {
        const today = moment();
        this.historicalDates.push(
          today.subtract(i, dates[this.lastDates]).unix() * 1000
        );
      }
    }
  }
}
