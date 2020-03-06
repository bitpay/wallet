import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
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

  public initChartData(params: { data; color }): void {
    const { data, color } = params;
    this.rates = data;
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
              eventEmitter.emit({
                date: data[index][0],
                price: data[index][1]
              });
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
          show: false
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
        colors: [color],
        curve: 'straight',
        width: 2
      },
      theme: {
        monochrome: {
          enabled: true,
          color
        }
      }
    };
  }
}
