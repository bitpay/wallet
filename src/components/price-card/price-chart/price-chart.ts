import { Component, ViewChild } from '@angular/core';
import * as Chart from 'chart.js';
import * as _ from 'lodash';
import { ConfigProvider } from '../../../providers';

@Component({
  selector: 'price-chart',
  templateUrl: 'price-chart.html'
})
export class PriceChart {
  @ViewChild('lineCanvas') lineCanvas;

  public lineChart: any;
  public isoCode: string;

  constructor(private configProvider: ConfigProvider) {
    this.isoCode = this.configProvider.get().wallet.settings.alternativeIsoCode;
  }

  drawCanvas(coin) {
    let rates = [];
    let labels = [];
    _.forEach(coin.historicalRates, (historicalRate, i) => {
      rates.push(historicalRate.rate);
      labels.push(`${i}`);
    });
    const context: CanvasRenderingContext2D = (this.lineCanvas
      .nativeElement as HTMLCanvasElement).getContext('2d');
    let gradient = context.createLinearGradient(0, 0, 0, 275);
    gradient.addColorStop(0, coin.gradientBackgroundColor);
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
          left: 0,
          right: 2
        }
      }
    };

    const data = {
      labels,
      datasets: [
        {
          fill: true,
          lineTension: 0.3,
          backgroundColor: gradient,
          borderColor: coin.backgroundColor,
          borderCapStyle: 'round',
          borderDash: [],
          borderDashOffset: 0.0,
          borderJoinStyle: 'round',
          pointBorderColor: coin.backgroundColor,
          pointBackgroundColor: coin.backgroundColor,
          pointBorderWidth: 1,
          pointHoverRadius: 1,
          pointHoverBackgroundColor: coin.backgroundColor,
          pointHoverBorderColor: 'rgba(220,220,220,1)',
          pointHoverBorderWidth: 1,
          pointRadius: 1,
          data: rates,
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
}
