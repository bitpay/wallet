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

Stats.prototype.lineChart = function(opts, data) {
  var margin = opts.margin || {
    top: 20,
    right: 20,
    bottom: 30,
    left: 50
  };

  var width = (opts.width || 960) - margin.left - margin.right;
  var height = (opts.height || 500) - margin.top - margin.bottom;

  var x = d3.time.scale().range([0, width]);
  x.domain(d3.extent(data, function(d) {
    return d[opts.x];
  }));

  var y = d3.scale.linear().range([height, 0]);
  y.domain(d3.extent(data, function(d) {
    return d[opts.y];
  }));

  var xAxis = d3.svg.axis().scale(x).orient('bottom').ticks(5);
  var yAxis = d3.svg.axis()
    .scale(y)
    .orient('left')
    .ticks(5);

  var line = d3.svg.line()
    .x(function(d) {
      return x(d[opts.x]);
    })
    .y(function(d) {
      return y(d[opts.y]);
    });

  var placeholder = '#' + (opts.placeholder || 'chart');
  d3.select(placeholder + ' svg').remove();
  var svg = d3.select(placeholder)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  svg.append('g')
    .attr('class', 'x axis ' + opts.class)
    .attr('transform', 'translate(0,' + height + ')')
    .call(xAxis);

  svg.append('g')
    .attr('class', 'y axis ' + opts.class)
    .attr('transform', 'translate(0,0)')
    .call(yAxis);

  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 6)
    .attr('dy', '.71em')
    .style('text-anchor', 'end')
    .text(opts.label);

  svg.append('path')
    .datum(data)
    .attr('class', 'line ' + opts.class)
    .attr('d', line);
};

Stats.prototype.showQty = function(data) {
  this.lineChart({
    x: 'date',
    y: 'qty',
    placeholder: 'chart-qty',
    label: 'Qty',
    class: 'qty',
    width: 800,
    height: 400,
  }, data);
};


Stats.prototype.showAmount = function(data) {
  this.lineChart({
    x: 'date',
    y: 'amount',
    placeholder: 'chart-amount',
    label: 'Amount (BTC)',
    class: 'amount',
    width: 800,
    height: 400,
  }, data);
};
