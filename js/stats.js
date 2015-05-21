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
  var parseDate = d3.time.format("%Y%m%d").parse;

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
  var margin = {
      top: 20,
      right: 20,
      bottom: 30,
      left: 50
    },
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

  var x = d3.time.scale()
    .range([0, width]);

  var y = d3.scale.linear()
    .range([height, 0]);

  var y2 = d3.scale.linear()
    .range([height, 0]);

  var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

  var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left");

  var yAxis2 = d3.svg.axis()
    .scale(y2)
    .orient("right");

  var line = d3.svg.line()
    .x(function(d) {
      return x(d.date);
    })
    .y(function(d) {
      return y(d.amount);
    });

  var line2 = d3.svg.line()
    .x(function(d) {
      return x(d.date);
    })
    .y(function(d) {
      return y2(d.qty);
    });


  d3.select("#chart svg").remove();
  var svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  x.domain(d3.extent(data, function(d) {
    return d.date;
  }));

  y.domain(d3.extent(data, function(d) {
    return d.amount;
  }));

  y2.domain(d3.extent(data, function(d) {
    return d.qty;
  }));

  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  svg.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(0,0)")
    .call(yAxis);

  svg.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + width + ",0)")
    .call(yAxis2);

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text("Amount (BTC)");

  svg.append("text")
    .attr("transform", "translate(" + width + ",0) rotate(-90)")
    .attr("y", -16)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text("Qty");

  svg.append("path")
    .datum(data)
    .attr("class", "line")
    .attr("d", line);

  svg.append("path")
    .datum(data)
    .attr("class", "line2")
    .attr("d", line2);
};
