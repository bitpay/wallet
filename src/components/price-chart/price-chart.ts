import { Component, ViewChild } from '@angular/core';
import { Chart } from '../../../node_modules/chart.js';
import {
  AppProvider,
  ConfigProvider,
  Logger,
  PriceProvider
} from '../../providers';

@Component({
  selector: 'price-chart',
  templateUrl: 'price-chart.html'
})
export class PriceChart {
  @ViewChild('lineCanvas') lineCanvas;

  public lineChart: any;
  public isCopay: boolean;
  public isoCode: string;
  public lastDates = 6;
  public historicalDates = [];
  public historicalRates = [];
  public currentPrice = 0;
  public averagePrice = 0;

  constructor(
    private appProvider: AppProvider,
    private priceProvider: PriceProvider,
    private configProvider: ConfigProvider,
    private logger: Logger
  ) {
    this.isCopay = this.appProvider.info.name === 'copay';
    this.isoCode = this.configProvider.get().wallet.settings.alternativeIsoCode;
    this.getPrices();
  }

  drawCanvas() {
    const context: CanvasRenderingContext2D = (this.lineCanvas
      .nativeElement as HTMLCanvasElement).getContext('2d');
    const gradientBackgroundColor = this.isCopay
      ? 'rgba(26,187,155,0.2)'
      : 'rgba(84,118,235, 0.2)';
    const brandColor = this.isCopay
      ? 'rgba(26,187,155,1)'
      : 'rgba(84,118,235, 1)';
    let gradient = context.createLinearGradient(0, 0, 0, 275);
    gradient.addColorStop(0, gradientBackgroundColor);
    gradient.addColorStop(0.35, 'rgba(255,255,255, 0.25)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    const options = {
      legend: {
        display: false
      },
      scales: {
        yAxes: [
          {
            display: false,
            gridLines: {
              display: false,
              drawBorder: false
            },
            ticks: {
              maxTicksLimit: 4,
              stepSize: 500
            }
          }
        ],
        xAxes: [
          {
            display: false,
            gridLines: {
              display: false,
              drawBorder: false
            }
          }
        ]
      },
      layout: {
        padding: {
          bottom: 10,
          top: 10,
          left: 2,
          right: 2
        }
      }
    };
    const data = {
      labels: [
        'first',
        'second',
        'third',
        'fourth',
        'fifth',
        'sixth',
        'seventh'
      ],
      datasets: [
        {
          fill: true,
          lineTension: 0.3,
          backgroundColor: gradient,
          borderColor: brandColor,
          borderCapStyle: 'round',
          borderDash: [],
          borderDashOffset: 0.0,
          borderJoinStyle: 'round',
          pointBorderColor: brandColor,
          pointBackgroundColor: brandColor,
          pointBorderWidth: 1,
          pointHoverRadius: 1,
          pointHoverBackgroundColor: brandColor,
          pointHoverBorderColor: 'rgba(220,220,220,1)',
          pointHoverBorderWidth: 1,
          pointRadius: 1,
          data: this.historicalRates,
          spanGaps: true,
          responsive: true
        }
      ]
    };

    this.lineChart = new Chart(this.lineCanvas.nativeElement, {
      type: 'line',
      data,
      options
    });
  }

  private getPrices() {
    this.priceProvider.getHistoricalBitcoinPrice(this.isoCode).subscribe(
      response => {
        this.historicalRates = response.map(res => res.rate).reverse();
        this.updateValues();
        this.drawCanvas();
      },
      err => {
        this.logger.error('Error getting rates:', err);
      }
    );
  }

  public updateCurrentPrice() {
    this.priceProvider.getCurrentBitcoinPrice(this.isoCode).subscribe(
      response => {
        this.historicalRates[this.historicalRates.length - 1] = response.rate;
        this.updateValues();
        this.drawCanvas();
      },
      err => {
        this.logger.error('Error getting current rate:', err);
      }
    );
  }

  private updateValues() {
    this.currentPrice = this.historicalRates[this.historicalRates.length - 1];
    this.averagePrice =
      ((this.currentPrice - this.historicalRates[0]) * 100) /
      this.historicalRates[0];
  }
}
