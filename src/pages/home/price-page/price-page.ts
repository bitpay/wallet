import { Component, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
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
  ActionSheetProvider,
  AnalyticsProvider,
  ConfigProvider,
  ErrorsProvider,
  ExchangeRatesProvider,
  Logger,
  ProfileProvider,
  SimplexProvider
} from '../../../providers';

@Component({
  selector: 'price-page',
  templateUrl: 'price-page.html'
})
export class PricePage {
  coin: any;
  wallet: any;
  wallets: any[];
  @ViewChild('canvas') canvas: PriceChart;
  private card: Card;
  public activeOption: string = '1D';
  public availableOptions;
  public updateOptions = [
    { label: '1D', lastDate: 1 },
    { label: '1W', lastDate: 7 },
    { label: '1M', lastDate: 31 }
  ];
  private supportedFiatCodes: string[] = [
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
    private simplexProvider: SimplexProvider,
    private profileProvider: ProfileProvider,
    private translate: TranslateService,
    private errorsProvider: ErrorsProvider,
    private actionSheetProvider: ActionSheetProvider,
    private analyticsProvider: AnalyticsProvider
  ) {
    this.card = _.clone(this.navParams.data.card);
    this.coin = this.card.unitCode;
    this.updateValues();
    this.setIsoCode();
  }

  ionViewDidLoad() {
    this.setPrice();
    this.drawCanvas();
  }

  private getPrice(lastDate) {
    this.canvas.loading = true;
    this.exchangeRatesProvider
      .getHistoricalRates(this.card.unitCode, this.isoCode, false, lastDate)
      .subscribe(
        response => {
          this.card.historicalRates = response;
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
    const { alternativeIsoCode } = this.configProvider.get().wallet.settings;
    this.isoCode = this.supportedFiatCodes.includes(alternativeIsoCode)
      ? alternativeIsoCode
      : 'USD';
    this.isIsoCodeSupported = _.includes(this.fiatCodes, this.isoCode);
  }

  public selectWallet() {
    this.wallets = this.profileProvider.getWallets({
      network: 'livenet',
      onlyComplete: true,
      coin: this.coin,
      backedUp: true
    });
    if (_.isEmpty(this.wallets)) {
      const err = this.translate.instant(
        'You do not have wallets able to receive funds'
      );
      const title = this.translate.instant('Error');
      this.errorsProvider.showDefaultError(err, title);
    } else {
      this.showWallets();
    }
  }

  public showWallets(): void {
    const params = {
      wallets: this.wallets,
      selectedWalletId: null,
      title: this.translate.instant('Select wallet to deposit to')
    };
    const walletSelector = this.actionSheetProvider.createWalletSelector(
      params
    );
    walletSelector.present();
    walletSelector.onDidDismiss(wallet => {
      this.onWalletSelect(wallet);
    });
  }

  private onWalletSelect(wallet): void {
    if (!_.isEmpty(wallet)) {
      this.wallet = wallet;
      this.goToAmountPage();
    }
  }

  private goToAmountPage() {
    this.analyticsProvider.logEvent('buy_crypto_button_clicked', {});
    this.navCtrl.push(AmountPage, {
      fromBuyCrypto: true,
      nextPage: 'CryptoPaymentMethodPage',
      walletId: this.wallet.id,
      coin: this.coin,
      currency: this.configProvider.get().wallet.settings.alternativeIsoCode
    });
  }
}
