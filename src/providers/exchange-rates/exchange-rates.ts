import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Observable } from 'rxjs/Observable';
import { shareReplay } from 'rxjs/operators';
import { ConfigProvider, Logger } from '../../providers';
import { CoinsMap } from '../../providers/currency/currency';

export interface ApiPrice {
  ts: number;
  rate: number;
  fetchedOn: number;
}

@Injectable()
export class ExchangeRatesProvider {
  private bwsURL: string;
  private ratesCache: {
    1?: Observable<CoinsMap<ApiPrice[]>>;
    7?: Observable<CoinsMap<ApiPrice[]>>;
    31?: Observable<CoinsMap<ApiPrice[]>>;
  } = {};

  constructor(
    private httpClient: HttpClient,
    private logger: Logger,
    private configProvider: ConfigProvider
  ) {
    this.logger.debug('ExchangeRatesProvider initialized');
    const defaults = this.configProvider.getDefaults();
    this.bwsURL = defaults.bws.url;
  }

  public getHistoricalRates(
    coin: string,
    isoCode: string,
    dateOffset = 1
  ): Observable<ApiPrice[]> {
    const observableBatch = [];
    const historicalDates = this.setDates(dateOffset);

    if (!this.ratesCache[dateOffset]) {
      _.forEach(historicalDates, date => {
        observableBatch.push(
          this.httpClient.get<ApiPrice>(
            `${this.bwsURL}/v1/fiatrates/${isoCode}?coin=${coin}&ts=${date}`
          ).pipe(shareReplay())
        );
      });
      this.ratesCache[dateOffset] = Observable.forkJoin(observableBatch);
    }
    return this.ratesCache[dateOffset];
  }

  public getCurrentRate(isoCode, coin?): Observable<ApiPrice> {
    return this.httpClient.get<ApiPrice>(
      `${this.bwsURL}/v1/fiatrates/${isoCode}?coin=${coin}`
    );
  }

  private setDates(dateOffset: number): number[] {
    const intervals = 120;
    const today = moment().set({
      hour: 15,
      minute: 0,
      second: 0,
      millisecond: 0
    });
    const lastDate = today.subtract(dateOffset, 'day').unix() * 1000;
    const historicalDates = [lastDate];
    const intervalOffset = Math.round((today.unix() * 1000 - lastDate) / intervals);

    for (let i = 0; i <= intervals; i++) {
      historicalDates.push(historicalDates[i] + intervalOffset);
    }
    return historicalDates;
  }
}
