import { Component } from '@angular/core';
import * as _ from 'lodash';
import * as moment from 'moment';
import {
  ConfigProvider,
  CurrencyProvider,
  ExchangeRatesProvider,
  Logger
} from '../../providers';
import { Coin } from '../../providers/currency/currency';

@Component({
  selector: 'exchange-rates',
  templateUrl: 'exchange-rates.html'
})
export class ExchangeRates {
  public lineChart: any;
  public isoCode: string;
  public lastDates = 6;
  public coins = [];
  public fiatCodes = [
    'USD',
    'INR',
    'GBP',
    'EUR',
    'CAD',
    'COP',
    'NGN',
    'BRL',
    'ARS',
    'AUD'
  ];

  constructor(
    private currencyProvider: CurrencyProvider,
    private exchangeRatesProvider: ExchangeRatesProvider,
    private configProvider: ConfigProvider,
    private logger: Logger
  ) {
    const availableChains = this.currencyProvider.getAvailableChains();
    for (const coin of availableChains) {
      const {
        backgroundColor,
        gradientBackgroundColor
      } = this.currencyProvider.getTheme(coin as Coin);
      const card = {
        unitCode: coin,
        historicalRates: [],
        currentPrice: 0,
        averagePrice: 0,
        backgroundColor,
        gradientBackgroundColor,
        name: this.currencyProvider.getCoinName(coin as Coin)
      };
      this.coins.push(card);
    }
    this.getPrices();
  }

  public getPrices() {
    this.setIsoCode();
    _.forEach(this.coins, (coin, index) => {
      this.exchangeRatesProvider
        .getHistoricalRates(this.isoCode, coin.unitCode)
        .subscribe(
          response => {
            this.coins[index].historicalRates = response.reverse();
            this.updateValues(index);
          },
          err => {
            this.logger.error('Error getting rates:', err);
          }
        );
    });
  }

  public updateCurrentPrice() {
    const lastRequest = this.coins[0].historicalRates[
      this.coins[0].historicalRates.length - 1
    ].ts;
    if (moment(lastRequest).isBefore(moment(), 'days')) {
      this.getPrices();
      return;
    }
    _.forEach(this.coins, (coin, i) => {
      this.exchangeRatesProvider
        .getCurrentRate(this.isoCode, coin.unitCode)
        .subscribe(
          response => {
            this.coins[i].historicalRates[
              this.coins[i].historicalRates.length - 1
            ] = response;
            this.updateValues(i);
          },
          err => {
            this.logger.error('Error getting current rate:', err);
          }
        );
    });
  }

  private updateValues(i: number) {
    this.coins[i].currentPrice = this.coins[i].historicalRates[
      this.coins[i].historicalRates.length - 1
    ].rate;
    this.coins[i].averagePrice =
      ((this.coins[i].currentPrice - this.coins[i].historicalRates[0].rate) *
        100) /
      this.coins[i].historicalRates[0].rate;
  }

  private setIsoCode() {
    const alternativeIsoCode = this.configProvider.get().wallet.settings
      .alternativeIsoCode;
    this.isoCode = _.includes(this.fiatCodes, alternativeIsoCode)
      ? alternativeIsoCode
      : 'USD';
  }
}
