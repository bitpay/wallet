import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { IMyDpOptions } from 'mydatepicker';

import { DataServicesService } from './services/data-services.service';
import * as moment from 'moment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [DataServicesService]
})
export class AppComponent implements OnInit {
  public totals: any;
  public coin: string;

  private opts: any;
  private config: any;
  private dataSet: Array<any>;
  private dateFrom: any = {};
  private dateTo: any = {};
  private selector: number;
  private datePickerOptions: IMyDpOptions = {
    dateFormat: 'yyyy-mm-dd',
  };

  constructor(
    private dataService: DataServicesService,
    private formBuilder: FormBuilder
  ) {
    const defaultDateFrom = '2015-01-01';
    const defaultDateTo = moment().format('YYYY-MM-DD');
    this.coin = 'BTC';
    this.dateFrom.formatted = defaultDateFrom;
    this.dateTo.formatted = defaultDateTo;
    this.selector = 0;
    this.dataSet = [];
    this.config = {};
    this.opts = {};
    this.opts.network = 'livenet';
    this.opts.url = 'https://bws.bitpay.com/bws/api';
    this.opts.from = defaultDateFrom;
    this.opts.to = defaultDateTo;
    this.totals = {};
  }

  ngOnInit() {
    this.fetch();
  }

  fetch(coin?: string) {
    this.opts.coin = coin || 'btc';
    this.dataService.fetch(this.opts, (err, data) => {
      if (err) {
        console.log('Error: ' + err);
        return;
      }
      this.dataSet = data;
      this.totals = this.dataService.getTotals(data);
      this.dataService.initGraphs(data);
    });
  }

  onSubmitNgModel(): void {
    this.opts.from = this.dateFrom.formatted;
    this.opts.to = this.dateTo.formatted;
    this.fetch(this.coin.toLowerCase());
  }

  getStatsFromCoin(coin: string) {
    this.coin = coin.toUpperCase();
    this.opts.from = this.dateFrom.formatted;
    this.opts.to = this.dateTo.formatted;
    this.fetch(coin);
  }

  walletsInterval(val) {
    this.config.graph = 'wallets';
    this.config.interval = val;
    this.config.chart = '#chart-wallets';
    this.dataService.show(this.dataSet, this.config);
  }

  proposalsInterval(val) {
    this.config.graph = 'proposals';
    this.config.interval = val;
    this.config.chart = '#chart-txps';
    this.dataService.show(this.dataSet, this.config);
  }

  amountInterval(val) {
    this.config.graph = 'amount';
    this.config.interval = val;
    this.config.chart = '#chart-amount';
    this.dataService.show(this.dataSet, this.config);
  }

  USDAmountInterval(val) {
    this.config.graph = 'usd-amount';
    this.config.interval = val;
    this.config.chart = '#chart-usd-amount';
    this.dataService.show(this.dataSet, this.config);
  }
}
