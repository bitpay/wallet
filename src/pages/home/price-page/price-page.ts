import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import * as _ from 'lodash';
import * as moment from 'moment';
import { FormatCurrencyPipe } from '../../../pipes/format-currency';

// Components
import { Card } from '../../../components/exchange-rates/exchange-rates';
import { PriceChart } from '../../../components/price-chart/price-chart';

// Pages
import { AmountPage } from '../../send/amount/amount';

// Providers
import {
  AnalyticsProvider,
  ConfigProvider,
  Logger,
  SimplexProvider
} from '../../../providers';
import { DateRanges, RateProvider } from '../../../providers/rate/rate';

@Component({
  selector: 'price-page',
  templateUrl: 'price-page.html'
})
export class PricePage {
  wallet: any;
  wallets: any[];
  @ViewChild('canvas') canvas: PriceChart;
  private card: Card;
  public activeOption: string = '1D';
  public availableOptions;
  public updateOptions = [
    { label: '1D', dateRange: DateRanges.Day },
    { label: '1W', dateRange: DateRanges.Week },
    { label: '1M', dateRange: DateRanges.Month }
  ];
  public isFiatIsoCodeSupported: boolean;
  public fiatIsoCode: string;
  public fiatCodes;
  constructor(
    private navCtrl: NavController,
    private navParams: NavParams,
    private rateProvider: RateProvider,
    private formatCurrencyPipe: FormatCurrencyPipe,
    private configProvider: ConfigProvider,
    private logger: Logger,
    private simplexProvider: SimplexProvider,
    private analyticsProvider: AnalyticsProvider
  ) {
    this.card = _.clone(this.navParams.data.card);
    this.setFiatIsoCode();
  }

  ionViewDidLoad() {
    this.drawCanvas();
    // Let the canvas settle
    setTimeout(() => {
      this.getPrice(DateRanges.Day);
    }, 1000);
  }

  private getPrice(dateRange) {
    this.canvas.loading = true;
    this.rateProvider.fetchHistoricalRates(this.fiatIsoCode, dateRange).then(
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
    this.card.totalBalanceChangeAmount = price - minPrice;
    this.card.totalBalanceChange =
      (this.card.totalBalanceChangeAmount * 100) / minPrice;
    const customPrecision = this.card.unitCode === 'xrp' ? 4 : 2;
    document.getElementById(
      'displayPrice'
    ).textContent = `${this.formatCurrencyPipe.transform(
      price,
      this.fiatIsoCode,
      customPrecision
    )}`;
    document.getElementById('displayDate').textContent = `${displayDate}`;
    document.getElementById(
      'averagePriceAmount'
    ).textContent = `${this.formatCurrencyPipe.transform(
      this.card.totalBalanceChangeAmount,
      this.fiatIsoCode,
      customPrecision
    )}`;
    document.getElementById(
      'averagePricePercent'
    ).textContent = `${this.formatCurrencyPipe.transform(
      this.card.totalBalanceChange,
      '%',
      2
    )}`;
  }

  private redrawCanvas() {
    this.canvas.loading = false;
    if (!this.canvas.chart) return;

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
    const { label, dateRange } = option;
    this.activeOption = label;
    this.getPrice(dateRange);
  }

  private updateValues() {
    this.card.currentPrice = this.card.historicalRates[0].rate;
    const minPrice = this.card.historicalRates[
      this.card.historicalRates.length - 1
    ].rate;
    this.card.totalBalanceChangeAmount = this.card.currentPrice - minPrice;
    this.card.totalBalanceChange =
      (this.card.totalBalanceChangeAmount * 100) / minPrice;
  }

  private setFiatIsoCode() {
    this.fiatCodes = this.simplexProvider.getSupportedFiatAltCurrencies();
    const { alternativeIsoCode } = this.configProvider.get().wallet.settings;
    this.fiatIsoCode = this.rateProvider.isAltCurrencyAvailable(
      alternativeIsoCode
    )
      ? alternativeIsoCode
      : 'USD';
    this.isFiatIsoCodeSupported = _.includes(this.fiatCodes, this.fiatIsoCode);
  }

  public goToAmountPage(): void {
    this.analyticsProvider.logEvent('buy_crypto_button_clicked', {});
    this.navCtrl.push(AmountPage, {
      coin: this.card.unitCode,
      fromBuyCrypto: true,
      nextPage: 'CryptoOrderSummaryPage',
      currency: this.configProvider.get().wallet.settings.alternativeIsoCode
    });
  }
}
