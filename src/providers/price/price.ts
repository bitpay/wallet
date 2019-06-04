import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Observable } from 'rxjs/Observable';
import { ConfigProvider, Logger } from '../../providers';

export interface ApiPrice {
  ts: number;
  rate: number;
  fetchedOn: number;
}

@Injectable()
export class PriceProvider {
  private bwsURL: string;
  private lastDates = 6;
  private historicalDates: any[];

  constructor(
    private httpClient: HttpClient,
    private logger: Logger,
    private configProvider: ConfigProvider
  ) {
    this.logger.debug('PriceProvider initialized');
    const defaults = this.configProvider.getDefaults();
    this.bwsURL = defaults.bws.url;
  }

  public getHistoricalBitcoinPrice(isoCode, coin?): Observable<ApiPrice[]> {
    let observableBatch = [];
    this.historicalDates = [];
    this.setDates();

    _.forEach(this.historicalDates, date => {
      observableBatch.push(
        this.httpClient.get<ApiPrice>(
          `${this.bwsURL}/v1/fiatrates/${isoCode}?coin=${coin}&ts=${date}`
        )
      );
    });

    return Observable.forkJoin(observableBatch);
  }

  public getCurrentBitcoinPrice(isoCode, coin?): Observable<ApiPrice> {
    return this.httpClient.get<ApiPrice>(
      `${this.bwsURL}/v1/fiatrates/${isoCode}?coin=${coin}`
    );
  }

  private setDates(): void {
    for (let i = 0; i <= this.lastDates; i++) {
      if (i == 0) {
        this.historicalDates.push(moment().unix() * 1000);
      } else {
        const today = moment().set({
          hour: 15,
          minute: 0,
          second: 0,
          millisecond: 0
        });
        this.historicalDates.push(today.subtract(i, 'day').unix() * 1000);
      }
    }
  }
}
