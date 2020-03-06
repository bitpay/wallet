import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Card } from '../../../components/exchange-rates/exchange-rates';
import { PriceChart } from '../../../components/price-chart/price-chart';
import { FormatCurrencyPipe } from '../../../pipes/format-currency';
import {
  ConfigProvider,
  ExchangeRatesProvider,
  Logger,
  SimplexProvider
} from '../../../providers';
import { AmountPage } from '../../send/amount/amount';

@Component({
  selector: 'price-page',
  templateUrl: 'price-page.html'
})
export class PricePage {
  @ViewChild('canvas') canvas: PriceChart;
  private card: Card;
  public activeOption: string = '1D';
  public availableOptions;
  public updateOptions = [
    { label: '1D', date: 'days', lastDates: 24 },
    { label: '1W', date: 'weeks', lastDates: 168 },
    { label: '1M', date: 'months', lastDates: 31 }
  ];
  public isIsoCodeSupported: boolean;
  public isoCode: string;
  public fiatCodes;
  constructor(
    private navCtrl: NavController,
    private navParams: NavParams,
    private exchangeRatesProvider: ExchangeRatesProvider,
    private formatCurrencyPipe: FormatCurrencyPipe,
    private configProvider: ConfigProvider,
    private logger: Logger,
    private simplexProvider: SimplexProvider
  ) {
    this.card = _.clone(this.navParams.data.card);
    this.updateValues();
    this.setIsoCode();
  }

  ionViewDidLoad() {
    this.setPrice();
    this.drawCanvas();
  }

  public goToBuyCrypto() {
    this.navCtrl.push(AmountPage, {
      nextPage: 'SimplexBuyPage',
      coin: this.card.unitCode,
      currency: this.isIsoCodeSupported ? this.isoCode : 'USD'
    });
  }

  private getPrice() {
    this.canvas.loading = true;
    this.exchangeRatesProvider
      .getHistoricalRates(this.isoCode, this.card.unitCode)
      .subscribe(
        response => {
          this.card.historicalRates = response.reverse();
          this.updateValues();
          this.setPrice();
          this.redrawCanvas();
        },
        err => {
          this.logger.error('Error getting rates:', err);
        }
      );
  }

  public setPrice(price = this.card.currentPrice) {
    const minPrice = this.card.historicalRates[0].rate;
    this.card.averagePriceAmount = price - minPrice;
    this.card.averagePrice = (this.card.averagePriceAmount * 100) / minPrice;
    document.getElementById(
      'showPrice'
    ).textContent = `${this.formatCurrencyPipe.transform(price, this.isoCode)}`;
    document.getElementById(
      'averagePriceAmount'
    ).textContent = `${this.formatCurrencyPipe.transform(
      this.card.averagePriceAmount,
      this.isoCode
    )}`;
    document.getElementById(
      'averagePricePercent'
    ).textContent = `${this.formatCurrencyPipe.transform(
      this.card.averagePrice,
      '%',
      2
    )}`;
  }

  private redrawCanvas() {
    const activeOption = this.activeOption;
    this.canvas.loading = false;
    const data = this.card.historicalRates.map(rate => [rate.ts, rate.rate]);
    this.canvas.chart.updateOptions(
      {
        chart: {
          animations: {
            enabled: true
          }
        },
        series: [
          {
            data
          }
        ],
        tooltip: {
          x: {
            show: false,
            formatter(val) {
              if (activeOption === '1M') {
                return `${moment(val).format('MMM DD')}`;
              } else if (activeOption === '1W') {
                return `${moment(val).format('MMM DD LT')}`;
              } else {
                return `${moment(val).format('ddd LT')}`;
              }
            }
          }
        }
      },
      false,
      true,
      true
    );
  }

  private drawCanvas() {
    this.canvas.initChartData(this.card, this.activeOption);
  }

  public updateChart(option) {
    this.activeOption = option.label;
    this.exchangeRatesProvider.lastDates = option.lastDates;
    this.getPrice();
  }

  private updateValues() {
    this.card.currentPrice = this.card.historicalRates[
      this.card.historicalRates.length - 1
    ].rate;
    const minPrice = this.card.historicalRates[0].rate;
    this.card.averagePriceAmount = this.card.currentPrice - minPrice;
    this.card.averagePrice = (this.card.averagePriceAmount * 100) / minPrice;
  }

  private setIsoCode() {
    this.fiatCodes = this.simplexProvider.getSupportedFiatAltCurrencies();
    this.isoCode = this.configProvider.get().wallet.settings.alternativeIsoCode;
    this.isIsoCodeSupported = _.includes(this.fiatCodes, this.isoCode);
  }
}
