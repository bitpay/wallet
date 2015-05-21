'use strict';

function Stats() {

};

// var URL = 'http://localhost:3232/bws/api';
var URL = 'https://bws-prodtest.bitpay.com/bws/api';
var FROM = '2015-01-01';


Stats.prototype.run = function() {
  var self = this;

  $('#network').change(function() {
    self.refresh();
  }).trigger('change');
};

Stats.prototype.refresh = function() {
  var self = this;

  var network = $('#network').val();
  this.fetch(network, function(err, data) {
    if (err) {
      self.error('Could not fetch data');
      return;
    }
    self.show(data);
  });
};

Stats.prototype.fetch = function(network, cb) {
  var self = this;

  var from = FROM;
  var to = moment().subtract(1, 'days').format('YYYY-MM-DD');
  var url = URL + '/v1/stats/' + from + '/' + to;

  d3.json(url)
    .get(function(error, data) {
      var data = self.transform(data[network]);
      return cb(null, data);
    });
};

Stats.prototype.transform = function(data) {
  var parseDate = d3.time.format('%Y%m%d').parse;

  data = _.map(data, function(v, k) {
    return {
      date: parseDate(k),
      amount: +v.totalAmount / 1e8,
      qty: +v.totalTx,
    };
  });
  return data;
};

Stats.prototype.error = function(msg) {
  alert(msg);
};

Stats.prototype.show = function(data) {
  this.showQty(data);
  this.showAmount(data);
};

Stats.prototype.showQty = function(data) {
  data = [{
    key: '# of Transactions',
    values: _.map(data, function(d) {
      return {
        x: d.date,
        y: d.qty
      };
    }),
  }];

  nv.addGraph(function() {
    var chart = nv.models.lineChart()
      .useInteractiveGuideline(true);

    chart.xAxis
      .tickFormat(function(d) {
        return d3.time.format('%b %d')(new Date(d));
      });

    chart.yAxis
      .axisLabel(data[0].key)
      .tickFormat(d3.format(',f'));

    d3.select('#chart-qty svg').remove();
    d3.select('#chart-qty')
      .append('svg')
      .datum(data)
      .transition().duration(500)
      .call(chart);

    nv.utils.windowResize(chart.update);

    return chart;
  });
};

Stats.prototype.showAmount = function(data) {
  console.log('*** [stats.js ln107] data:', data); // TODO

  data = [{
    key: 'Amount (BTC)',
    values: _.map(data, function(d) {
      return {
        x: d.date,
        y: d.amount
      };
    }),
  }];

  nv.addGraph(function() {
    var chart = nv.models.lineChart()
      .useInteractiveGuideline(true);

    chart.xAxis
      .tickFormat(function(d) {
        return d3.time.format('%b %d')(new Date(d));
      });

    chart.yAxis
      .axisLabel(data[0].key)
      .tickFormat(d3.format('.02f'));

    d3.select('#chart-amount svg').remove();
    d3.select('#chart-amount')
      .append('svg')
      .datum(data)
      .transition().duration(500)
      .call(chart);

    nv.utils.windowResize(chart.update);

    return chart;
  });
};
