import { Component } from '@angular/core';
import { Events, NavController } from 'ionic-angular';
import * as _ from 'lodash';
import { PricePage } from '../../pages/home/price-page/price-page';
import { ConfigProvider, CurrencyProvider, Logger } from '../../providers';
import { Coin } from '../../providers/currency/currency';
import {
  DateRanges,
  ExchangeRate,
  ExchangeRatesProvider
} from '../../providers/exchange-rates/exchange-rates';

export interface Card {
  unitCode: string;
  historicalRates: any;
  currentPrice: number;
  averagePrice: number;
  averagePriceAmount: number;
  backgroundColor: string;
  gradientBackgroundColor: string;
  name: string;
}

@Component({
  selector: 'exchange-rates',
  templateUrl: 'exchange-rates.html'
})
export class ExchangeRates {
  public isIsoCodeSupported: boolean;
  public isoCode: string;
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
    private navCtrl: NavController,
    private currencyProvider: CurrencyProvider,
    private exchangeRatesProvider: ExchangeRatesProvider,
    private configProvider: ConfigProvider,
    private logger: Logger,
    private events: Events
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
        averagePriceAmount: 0,
        backgroundColor,
        gradientBackgroundColor,
        name: this.currencyProvider.getCoinName(coin as Coin)
      };
      this.coins.push(card);
    }
    this.getPrices();
    this.events.subscribe('Local/PriceUpdate', () => {
      this.getPrices(true);
    });
  }

  public goToPricePage(card) {
    this.navCtrl.push(PricePage, { card });
  }

  public getPrices(force: boolean = false) {
    this.setIsoCode();

    // TODO: Add a new endpoint in BWS that
    // provides JUST  the current prices and the delta.
    this.exchangeRatesProvider
      .fetchHistoricalRates(this.isoCode, force, DateRanges.Day)
      .then(response => {
        _.forEach(this.coins, (coin, index) => {
          if (response[coin.unitCode])
            this.update(index, response[coin.unitCode]);
        });
        err => {
          this.logger.error('Error getting rates:', err);
        };
      });
  }

  private update(i: number, values: ExchangeRate[]) {
    if (!values[0] || !_.last(values)) {
      this.logger.warn('No exchange rate data');
      return;
    }
    const lastRate = _.last(values).rate;
    this.coins[i].currentPrice = values[0].rate;
    this.coins[i].averagePriceAmount = this.coins[i].currentPrice - lastRate;
    this.coins[i].averagePrice =
      (this.coins[i].averagePriceAmount * 100) / lastRate;
  }

  private setIsoCode() {
    const alternativeIsoCode = this.configProvider.get().wallet.settings
      .alternativeIsoCode;
    this.isIsoCodeSupported = _.includes(this.fiatCodes, alternativeIsoCode);
    this.isoCode = this.isIsoCodeSupported ? alternativeIsoCode : 'USD';
  }

  public getDigitsInfo(coin: string) {
    switch (coin) {
      case 'xrp':
        return '1.4-4';
      default:
        return '1.2-2';
    }
  }
}
