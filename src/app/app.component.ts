import { Component, OnInit} from '@angular/core';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';
import {IMyDpOptions} from 'mydatepicker';

import { DataServicesService } from './services/data-services.service';
import * as moment from 'moment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [DataServicesService]
})
export class AppComponent implements OnInit {

  private opts: any;
  private config: any;
  private dataSet: Array<any>;

  public totals: any;

  private myForm: FormGroup;

  private model1: any = {};   // not initial date set (use null or empty string)
  private model2: any = {};
  //private model: Object = {jsdate: new Date()};   // initialize today with jsdate property
  //private model: Object = {date: {year: 2018, month: 10, day: 9}};   // this example is initialized to specific date
  //private model: Object = {formatted: '24.09.2018'};   // this example is initialized to specific date

  private selector: number = 0;

  private myDatePickerOptions: IMyDpOptions = {
    dateFormat: 'yyyy-mm-dd',
  };


  constructor(private ds: DataServicesService, private formBuilder: FormBuilder) {
    var defaultDateFrom = '2015-01-01'
    var defaultDateTo = moment().subtract(1, 'days').format('YYYY-MM-DD');
    this.model1.formatted = '2015-01-01';
    this.model2.formatted = defaultDateTo;
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

  fetch() {
    this.ds.fetch(this.opts, (err, data) => {
      if (err) {
        return;
      }
      this.dataSet = data;
      this.totals = this.ds.getTotals(data);
      this.ds.initGraphs(data);
    });
  }

  onSubmitNgModel(): void {
    this.opts.from = this.model1.formatted;
    this.opts.to = this.model2.formatted;
    this.fetch();
  }

  walletsInterval(val) {
    this.config.graph = 'wallets';
    this.config.interval = val;
    this.config.chart = '#chart-wallets';
    console.log(this.config.interval);
    this.ds.show(this.dataSet, this.config);
  };

  proposalsInterval(val) {
    this.config.graph = 'proposals';
    this.config.interval = val;
    this.config.chart = '#chart-txps';
    this.ds.show(this.dataSet, this.config);
  };

  amountInterval(val) {
    this.config.graph = 'amount';
    this.config.interval = val;
    this.config.chart = '#chart-amount';
    this.ds.show(this.dataSet, this.config);
  };
}
