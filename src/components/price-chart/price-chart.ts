import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import * as moment from 'moment';
import { ChartComponent } from '../chart-component/chart-component';
@Component({
  selector: 'price-chart',
  templateUrl: 'price-chart.html'
})
export class PriceChart {
  @ViewChild('chart') chart: ChartComponent;
  @Output() priceChange = new EventEmitter();
  public chartOptions;
  public rates;
  public loading: boolean = false;
  constructor() {}

  public initChartData(dataSeries, activeOption): void {
    this.rates = dataSeries.historicalRates.map(historicalRate => [
      historicalRate.ts,
      historicalRate.rate
    ]);
    const eventEmitter = this.priceChange;
    this.chartOptions = {
      series: [
        {
          name: '',
          data: this.rates
        }
      ],
      chart: {
        type: 'line',
        stacked: false,
        height: 350,
        toolbar: {
          show: false
        },
        animations: {
          enabled: false
        },
        events: {
          mouseMove(_event, _chart, options) {
            const data = options.config.series[0].data;
            const index = options.dataPointIndex;
            if (data && data[index] && data[index][1]) {
              eventEmitter.emit(data[index][1]);
            }
            const tooltip = document.getElementsByClassName(
              'apexcharts-xaxistooltip'
            )[0] as HTMLElement;
            const tooltipStyle = _event.view.getComputedStyle(tooltip);
            const offsetLeft = parseInt(
              tooltipStyle.getPropertyValue('left'),
              10
            );
            const width = parseInt(tooltipStyle.getPropertyValue('width'), 10);
            const screenWidth = _event.view.screen.width;
            const offsetRight = screenWidth - (offsetLeft + width);
            if (offsetLeft && offsetLeft < 0) {
              tooltip.style.left = '0';
            } else if (offsetRight && offsetRight < 0) {
              tooltip.style.left = `${offsetLeft + offsetRight}px`;
            }
          }
        }
      },
      dataLabels: {
        enabled: false
      },
      markers: {
        size: 0,
        hover: {
          size: 0
        }
      },
      tooltip: {
        followCursor: true,
        shared: false,
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
      },
      grid: {
        padding: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0
        },
        show: false,
        xaxis: {
          lines: {
            show: false
          }
        },
        yaxis: {
          lines: {
            show: false
          }
        }
      },
      xaxis: {
        labels: {
          show: false
        },
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        }
      },
      yaxis: {
        show: false,
        labels: {
          show: false
        },
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        }
      },
      stroke: {
        colors: [dataSeries.backgroundColor],
        curve: 'straight',
        width: 2
      },
      theme: {
        monochrome: {
          enabled: true,
          color: dataSeries.backgroundColor
        }
      }
    };
  }
}
