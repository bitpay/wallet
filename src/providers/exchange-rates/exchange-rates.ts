import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import * as moment from 'moment';
import { ConfigProvider, Logger } from '../../providers';

export interface ExchangeRate {
  rate: number;
  ts: number;
}

export enum DateRanges {
  Day = 1,
    Week = 7,
    Month = 30,
}

export interface HistoricalRates {
  'btc': ExchangeRate[],
};


@Injectable()
export class ExchangeRatesProvider {
  private bwsURL: string;
  private ratesCache: any;

  constructor(
    private httpClient: HttpClient,
    private logger: Logger,
    private configProvider: ConfigProvider
  ) {
    this.logger.debug('ExchangeRatesProvider initialized');
    const defaults = this.configProvider.getDefaults();
    this.bwsURL = defaults.bws.url;
    this.ratesCache = {
      1:[], 
      7:[], 
      30:[], 
    };
  }

  public getLastDayRates(): Promise<HistoricalRates> {
    const isoCode =
      this.configProvider.get().wallet.settings.alternativeIsoCode || 'USD';
    return  this.fetchHistoricalRates(
      isoCode,
    );
  }

  public fetchHistoricalRates(
    isoCode: string, // fiat Code
    force: boolean = false, // TODO: review
    dateRange: DateRanges = DateRanges.Day,
  ): Promise<HistoricalRates> {
    const firstDateTs = moment()
        .subtract(dateRange, 'days')
        .startOf('hour')
        .unix() * 1000;

    if (_.isEmpty(this.ratesCache[dateRange]) || force) {
      this.logger.debug(`Refreshing Exchange rates for ${isoCode} period ${dateRange}`);
      // This pulls ALL coins in one query
      const req = this.httpClient.get<ExchangeRate[]>(
        `${this.bwsURL}/v2/fiatrates/${isoCode}?ts=${firstDateTs}`
      );

      this.ratesCache[dateRange] = req.first().toPromise();
    }
    return this.ratesCache[dateRange];
  }
}
