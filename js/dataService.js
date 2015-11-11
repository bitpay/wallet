var app = angular.module("statsApp.dataService", []);
app.service('dataService', function($rootScope) {
  var root = {};

  root.fetch = function(opts, cb) {
    var utl = opts.url + '/v1/stats/?network=' + opts.network + '&from=' + opts.from + '&to=' + opts.to;

    d3.json(utl)
      .get(function(err, data) {
        if (err) return cb(err);
        if (!data || _.isEmpty(data)) return cb('No data');

        var data = root.transform(data);
        return cb(null, data);
      });
  };

  root.transform = function(data) {
    var parseDate = d3.time.format('%Y%m%d').parse;

    var result = {};
    _.each(data.newWallets.byDay, function(d) {
      if (!result[d.day]) result[d.day] = {};
      result[d.day].walletCount = d.count;
    });

    _.each(data.txProposals.amountByDay, function(d) {
      if (!result[d.day]) result[d.day] = {};
      result[d.day].txAmount = d.amount / 1e8;
    });

    _.each(data.txProposals.nbByDay, function(d) {
      if (!result[d.day]) result[d.day] = {};
      result[d.day].txCount = d.count;
    });

    return _.map(result, function(v, k) {
      var d = new Date(parseDate(k));

      return {
        date: parseDate(k),
        amount: v.txAmount,
        txps: v.txCount,
        wallets: v.walletCount,
        week: d.getFullYear() + '-' + d.getWeek(),
        month: d.getFullYear() + '-' + d.getMonth()
      };
    });
  };

  Date.prototype.getWeek = function() {
    var onejan = new Date(this.getFullYear(), 0, 1);
    return Math.ceil((((this - onejan) / 86400000) + onejan.getDay() + 1) / 7);
  }

  root.error = function(msg) {
    alert(msg);
  };

  root.showTotals = function(data) {
    function addCommas(nStr) {
      nStr += '';
      var x = nStr.split('.');
      var x1 = x[0];
      var x2 = x.length > 1 ? '.' + x[1] : '';
      var rgx = /(\d+)(\d{3})/;
      while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
      }
      return x1 + x2;
    };

    var total = _.reduce(data, function(memo, d) {
      memo.wallets += (d.wallets || 0);
      memo.txps += (d.txps || 0);
      memo.amount += (d.amount || 0);
      return memo;
    }, {
      wallets: 0,
      txps: 0,
      amount: 0
    });

    $('#total-wallets .value').html(addCommas(total.wallets));
    $('#total-txps .value').html(addCommas(total.txps));
    $('#total-amount .value').html(addCommas(total.amount.toFixed(2)));
  };

  root.getCoords = function(data, graph) {
    var opts = {};

    if (graph == 'wallets') {
      opts.yValue = 'wallets';
      opts.key = '# of New wallets';
    } else if (graph == 'proposals') {
      opts.yValue = 'txps';
      opts.key = '# of Proposals';
    } else if (graph == 'amount') {
      opts.yValue = 'amount';
      opts.key = 'Amount sent';
    }

    var byMonth = _.groupBy(data, 'month');
    var byMonthGrouped = _.map(byMonth, function(v, k) {
      return {
        x: v[0].date,
        y: _.sum(v, opts.yValue)
      }
    });

    var byWeek = _.groupBy(data, 'week');
    var byWeekGrouped = _.map(byWeek, function(v, k) {
      return {
        x: v[0].date,
        y: _.sum(v, opts.yValue)
      }
    });

    var coordsPerMonth = [{
      key: opts.key + ' per month',
      values: byMonthGrouped
    }];

    var coordsPerWeek = [{
      key: opts.key + ' per week',
      values: byWeekGrouped
    }];

    var dataCoords = _.map(data, function(d) {
      return _.pick(d, ['date', opts.yValue]);
    });

    var coordsPerDay = [{
      key: opts.key + ' per day',
      values: _.map(dataCoords, function(d) {
        return {
          x: d.date,
          y: d[opts.yValue]
        }
      })
    }];

    return {
      perMonth: coordsPerMonth,
      perWeek: coordsPerWeek,
      perDay: coordsPerDay
    };
  };

  root.show = function(dataSet, config) {
    var coords = root.getCoords(dataSet, config.graph);

    nv.addGraph(function() {
      var opts = {};

      if (config.interval == 'perDay') {
        opts.coords = coords.perDay;
        opts.format = '%b %d';
        opts.label = coords.perDay[0].key;
      } else if (config.interval == 'perMonth') {
        opts.coords = coords.perMonth;
        opts.format = '%b';
        opts.label = coords.perMonth[0].key;
      } else if (config.interval == 'perWeek') {
        opts.coords = coords.perWeek;
        opts.format = '%W';
        opts.label = coords.perWeek[0].key;
      }
      var chart = nv.models.lineChart()
        .useInteractiveGuideline(true);

      chart.xAxis
        .tickFormat(function(d) {
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
  };

  root.initGraphs = function(data) {
    root.showTotals(data);
    root.show(data, {
      graph: 'wallets',
      interval: 'perDay',
      chart: '#chart-wallets'
    });
    root.show(data, {
      graph: 'proposals',
      interval: 'perDay',
      chart: '#chart-txps'
    });
    root.show(data, {
      graph: 'amount',
      interval: 'perDay',
      chart: '#chart-amount'
    });
    $rootScope.$emit('Data/Finish');
  };

  return root;
});
