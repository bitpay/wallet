import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
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
    isoCode,
    lastDate
  ): Observable<CoinsMap<ApiPrice[]>> {
    const today = moment();
    const ts = today.subtract(lastDate, 'days').unix() * 1000;
    const url = `${this.bwsURL}/v2/fiatrates/${isoCode}?ts=${ts}`;

    if (!this.ratesCache[lastDate]) {
      this.ratesCache[lastDate] = this.httpClient
        .get<CoinsMap<ApiPrice[]>>(url)
        .pipe(shareReplay());
    }
    return this.ratesCache[lastDate];
  }

  public getCurrentRate(isoCode, coin?): Observable<ApiPrice> {
    return this.httpClient.get<ApiPrice>(
      `${this.bwsURL}/v1/fiatrates/${isoCode}?coin=${coin}`
    );
  }
}
