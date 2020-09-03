import { Component } from '@angular/core';
import { Events, NavController } from 'ionic-angular';
import * as _ from 'lodash';
import { PricePage } from '../../pages/home/price-page/price-page';
import { ConfigProvider, CurrencyProvider, Logger } from '../../providers';
import { Coin } from '../../providers/currency/currency';
import {
  DateRanges,
  ExchangeRate,
  RateProvider
} from '../../providers/rate/rate';

export interface Card {
  unitCode: string;
  historicalRates: any;
  currentPrice: number;
  totalBalanceChange: number;
  totalBalanceChangeAmount: number;
  backgroundColor: string;
  gradientBackgroundColor: string;
  name: string;
}

@Component({
  selector: 'exchange-rates',
  templateUrl: 'exchange-rates.html'
})
export class ExchangeRates {
  public isFiatIsoCodeSupported: boolean;
  public fiatIsoCode: string;
  public coins = [];

  constructor(
    private navCtrl: NavController,
    private currencyProvider: CurrencyProvider,
    private rateProvider: RateProvider,
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
        totalBalanceChange: 0,
        totalBalanceChangeAmount: 0,
        backgroundColor,
        gradientBackgroundColor,
        name: this.currencyProvider.getCoinName(coin as Coin)
      };
      this.coins.push(card);
    }
    this.getPrices();
    this.events.subscribe('Local/PriceUpdate', () => {
      this.getPrices();
    });
  }

  public goToPricePage(card) {
    this.navCtrl.push(PricePage, { card });
  }

  public getPrices() {
    this.setIsoCode();

    // TODO: Add a new endpoint in BWS that
    // provides JUST  the current prices and the delta.
    this.rateProvider
      .fetchHistoricalRates(this.fiatIsoCode, DateRanges.Day)
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
    this.coins[i].totalBalanceChangeAmount =
      this.coins[i].currentPrice - lastRate;
    this.coins[i].totalBalanceChange =
      (this.coins[i].totalBalanceChangeAmount * 100) / lastRate;
  }

  private setIsoCode() {
    const alternativeIsoCode = this.configProvider.get().wallet.settings
      .alternativeIsoCode;
    this.isFiatIsoCodeSupported = this.rateProvider.isAltCurrencyAvailable(
      alternativeIsoCode
    );
    this.fiatIsoCode = this.isFiatIsoCodeSupported ? alternativeIsoCode : 'USD';
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
