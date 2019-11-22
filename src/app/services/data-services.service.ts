import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import * as d3 from 'd3';
import * as nv from 'nvd3';

@Injectable()
export class DataServicesService {

  constructor() { }

  fetch(opts, cb) {
    const url = opts.url + '/v1/stats/?network=' + opts.network + '&coin=' + opts.coin + '&from=' + opts.from + '&to=' + opts.to;

    d3.json(url)
      .get((err, data) => {
        if (err) {
          return cb(err);
        }
        if (!data || _.isEmpty(data)) {
          return cb('No data');
        }

        const info = this.transform(data);
        console.log('### INFO: ', info);
        return cb(null, info);
      });
  }

  transform(data) {
    const parseDate = d3.time.format('%Y%m%d').parse;
    const result = {};

    _.each(data.newWallets.byDay, (d) => {
      if (!result[d.day]) {
        result[d.day] = {};
      }
      result[d.day].walletCount = d.count;
    });

    _.each(data.txProposals.amountByDay, (d) => {
      if (!result[d.day]) {
        result[d.day] = {};
      }
      result[d.day].txAmount = d.amount / 1e8;
    });

    _.each(data.txProposals.nbByDay, (d) => {
      if (!result[d.day]) {
        result[d.day] = {};
      }
      result[d.day].txCount = d.count;
    });

    _.each(data.fiatRates.byDay, (d) => {
      if (!result[d.day]) {
        result[d.day] = {};
      }
      result[d.day].fiatRate = d.value;
    });

    return _.map(result, (v: any, k: any) => {
      const d = new Date(parseDate(k));
      return {
        date: parseDate(k),
        amount: v.txAmount || 0,
        fiatRate: v.fiatRate,
        USDAmount: v.fiatRate * v.txAmount || 0,
        txps: v.txCount || 0,
        wallets: v.walletCount || 0,
        week: d.getFullYear() + '-' + this.getWeek(d),
        month: d.getFullYear() + '-' + d.getMonth()
      };
    });
  }

  getWeek(d) {
    const onejan: any = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
  }

  getTotals(data) {
    function addCommas(nStr) {
      nStr += '';
      const x = nStr.split('.');
      let x1 = x[0];
      const x2 = x.length > 1 ? '.' + x[1] : '';
      const rgx = /(\d+)(\d{3})/;
      while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
      }
      return x1 + x2;
    }

    const total = _.reduce(data, (memo, d: any) => {
      memo.wallets += (d.wallets || 0);
      memo.txps += (d.txps || 0);
      memo.amount += (d.amount || 0);
      memo.USDAmount += (d.USDAmount || 0);
      return memo;
    }, {
      wallets: 0,
      txps: 0,
      amount: 0,
      USDAmount: 0
    });

    return {
      totalWallets: total.wallets,
      totalTxps: total.txps,
      totalAmount: total.amount.toFixed(2),
      totalUSDAmount: total.USDAmount.toFixed(2)
    };
  }

  getCoords(data, graph) {
    const opts: any = {};

    if (graph === 'wallets') {
      opts.yValue = 'wallets';
      opts.key = '# of New wallets';
    } else if (graph === 'proposals') {
      opts.yValue = 'txps';
      opts.key = '# of Proposals';
    } else if (graph === 'amount') {
      opts.yValue = 'amount';
      opts.key = 'Amount sent';
    } else if (graph === 'usd-amount') {
      opts.yValue = 'USDAmount';
      opts.key = 'USD Amount sent';
    }

    const byMonth = _.groupBy(data, 'month');
    const byMonthGrouped = _.map(byMonth, (v: any, k) => {
      return {
        x: v[0].date,
        y: _.sumBy(v, opts.yValue)
      };
    });

    const byWeek = _.groupBy(data, 'week');
    const byWeekGrouped = _.map(byWeek, (v: any, k) => {
      return {
        x: v[0].date,
        y: _.sumBy(v, opts.yValue)
      };
    });

    const coordsPerMonth = [{
      key: opts.key + ' per month',
      values: byMonthGrouped
    }];

    const coordsPerWeek = [{
      key: opts.key + ' per week',
      values: byWeekGrouped
    }];

    const dataCoords = _.map(data, (d) => {
      return _.pick(d, ['date', opts.yValue]);
    });

    const coordsPerDay = [{
      key: opts.key + ' per day',
      values: _.map(dataCoords, (d: any) => {
        return {
          x: d.date,
          y: d[opts.yValue]
        };
      })
    }];

    return {
      perMonth: coordsPerMonth,
      perWeek: coordsPerWeek,
      perDay: coordsPerDay
    };
  }

  show(dataSet, config) {
    const coords = this.getCoords(dataSet, config.graph);
    console.log(coords);
    nv.addGraph(() => {
      const opts: any = {};

      if (config.interval === 'perDay') {
        opts.coords = coords.perDay;
        opts.format = '%b %d';
        opts.label = coords.perDay[0].key;
      } else if (config.interval === 'perMonth') {
        opts.coords = coords.perMonth;
        opts.format = '%b';
        opts.label = coords.perMonth[0].key;
      } else if (config.interval === 'perWeek') {
        opts.coords = coords.perWeek;
        opts.format = '%W';
        opts.label = coords.perWeek[0].key;
      }
      const chart = nv.models.lineChart()
        .useInteractiveGuideline(true);

      chart.xAxis
        .tickFormat((d) => {
          return d3.time.format(opts.format)(new Date(d));
        });

      chart.yAxis
        .axisLabel(opts.label)
        .tickFormat(d3.format(',f'));

      d3.select(config.chart + ' svg').remove();
      d3.select(config.chart)
        .append('svg')
        .datum(opts.coords)
        .transition().duration(500)
        .call(chart);

      nv.utils.windowResize(chart.update);

      return chart;
    });
  }

  initGraphs(data) {
    this.show(data, {
      graph: 'wallets',
      interval: 'perDay',
      chart: '#chart-wallets'
    });
    this.show(data, {
      graph: 'proposals',
      interval: 'perDay',
      chart: '#chart-txps'
    });
    this.show(data, {
      graph: 'amount',
      interval: 'perDay',
      chart: '#chart-amount'
    });
    this.show(data, {
      graph: 'usd-amount',
      interval: 'perDay',
      chart: '#chart-usd-amount'
    });
  }
}
