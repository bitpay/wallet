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
    { label: '1D', lastDate: 1 },
    { label: '1W', lastDate: 7 },
    { label: '1M', lastDate: 31 }
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

  private getPrice(lastDate) {
    this.canvas.loading = true;
    this.exchangeRatesProvider
      .getHistoricalRates(this.isoCode, lastDate)
      .subscribe(
        response => {
          this.card.historicalRates = response[this.card.unitCode];
          this.updateValues();
          this.setPrice();
          this.redrawCanvas();
        },
        err => {
          this.logger.error('Error getting rates:', err);
        }
      );
  }

  private formatDate(date) {
    if (this.activeOption === '1Y') {
      return `${moment(date).format('MMM DD YYYY')}`;
    } else if (this.activeOption === '1M') {
      return `${moment(date).format('MMM DD hh A')}`;
    } else if (this.activeOption === '1W') {
      return `${moment(date).format('ddd hh:mm A')}`;
    } else {
      return `${moment(date).format('hh:mm A')}`;
    }
  }

  public setPrice(points: { date?: number; price?: number } = {}) {
    const { date, price = this.card.currentPrice } = points;
    const displayDate = date
      ? this.formatDate(date)
      : this.card.unitCode.toUpperCase();
    const minPrice = this.card.historicalRates[
      this.card.historicalRates.length - 1
    ].rate;
    this.card.averagePriceAmount = price - minPrice;
    this.card.averagePrice = (this.card.averagePriceAmount * 100) / minPrice;
    const customPrecision = this.card.unitCode === 'xrp' ? 4 : 2;
    document.getElementById(
      'displayPrice'
    ).textContent = `${this.formatCurrencyPipe.transform(
      price,
      this.isoCode,
      customPrecision
    )}`;
    document.getElementById('displayDate').textContent = `${displayDate}`;
    document.getElementById(
      'averagePriceAmount'
    ).textContent = `${this.formatCurrencyPipe.transform(
      this.card.averagePriceAmount,
      this.isoCode,
      customPrecision
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
            show: false
          }
        }
      },
      false,
      true,
      true
    );
  }

  private drawCanvas() {
    const dataSeries = this.card.historicalRates.map(historicalRate => [
      historicalRate.ts,
      historicalRate.rate
    ]);
    this.canvas.initChartData({
      data: dataSeries,
      color: this.card.backgroundColor
    });
  }

  public updateChart(option) {
    const { label, lastDate } = option;
    this.activeOption = label;
    this.getPrice(lastDate);
  }

  private updateValues() {
    this.card.currentPrice = this.card.historicalRates[0].rate;
    const minPrice = this.card.historicalRates[
      this.card.historicalRates.length - 1
    ].rate;
    this.card.averagePriceAmount = this.card.currentPrice - minPrice;
    this.card.averagePrice = (this.card.averagePriceAmount * 100) / minPrice;
  }

  private setIsoCode() {
    this.fiatCodes = this.simplexProvider.getSupportedFiatAltCurrencies();
    this.isoCode = this.configProvider.get().wallet.settings.alternativeIsoCode;
    this.isIsoCodeSupported = _.includes(this.fiatCodes, this.isoCode);
  }
}
