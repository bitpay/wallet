'use strict';

var RateService = function($http) {
  this.isAvailable = false;
  this.SAT_TO_BTC = 1 / 1e8;
  var that = this;
  var backoff = 5;
  var retrieve = function() {
    $http({method: 'GET', url: 'https://bitpay.com/api/rates'}).
    success(function(data, status, headers, config) {
      var rates = {};
      data.forEach(function(element) {
        rates[element.code] = element.rate;
      });
      that.isAvailable = true;
      that.rates = rates;
    }).
    error(function(data, status, headers, config) {
      backoff *= 1.5;
      setTimeout(retrieve, backoff * 1000);
    });
  };
  retrieve();
};

RateService.prototype.toFiat = function(satoshis, code) {
  if (!this.isAvailable) {
    return 0;
  }
  return satoshis * this.SAT_TO_BTC * this.rates[code];
};

RateService.prototype.fromFiat = function(amount, code) {
  if (!this.isAvailable) {
    return 0;
  }
  return amount / this.rates[code] / this.SAT_TO_BTC;
};

angular.module('copayApp.services').service('rateService', RateService);
