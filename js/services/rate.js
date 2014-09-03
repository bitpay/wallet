'use strict';

var RateService = function(request) {
  this.isAvailable = false;
  this.UNAVAILABLE_ERROR = 'Service is not available - check for service.isAvailable or use service.whenAvailable';
  this.SAT_TO_BTC = 1 / 1e8;
  var MINS_IN_HOUR = 60;
  var MILLIS_IN_SECOND = 1000;
  var rateServiceConfig = config.rate;
  var updateFrequencySeconds = rateServiceConfig.updateFrequencySeconds || 60 * MINS_IN_HOUR;
  var rateServiceUrl = rateServiceConfig.url || 'https://bitpay.com/api/rates';
  this.queued = [];
  this.alternatives = [];
  var that = this;
  var backoffSeconds = 5;
  var retrieve = function() {
    request.get({
      url: rateServiceUrl,
      json: true
    }, function(err, response, listOfCurrencies) {
      if (err) {
        backoffSeconds *= 1.5;
        setTimeout(retrieve, backoffSeconds * MILLIS_IN_SECOND);
        return;
      }
      var rates = {};
      listOfCurrencies.forEach(function(element) {
        rates[element.code] = element.rate;
        that.alternatives.push({
          name: element.name,
          isoCode: element.code,
          rate: element.rate
        });
      });
      that.isAvailable = true;
      that.rates = rates;
      that.queued.forEach(function(callback) {
        setTimeout(callback, 1);
      });
      setTimeout(retrieve, updateFrequencySeconds * MILLIS_IN_SECOND);
    });
  };
  retrieve();
};

RateService.prototype.whenAvailable = function(callback) {
  if (this.isAvailable) {
    setTimeout(callback, 1);
  } else {
    this.queued.push(callback);
  }
};

RateService.prototype.toFiat = function(satoshis, code) {
  if (!this.isAvailable) {
    throw new Error(this.UNAVAILABLE_ERROR);
  }
  return satoshis * this.SAT_TO_BTC * this.rates[code];
};

RateService.prototype.fromFiat = function(amount, code) {
  if (!this.isAvailable) {
    throw new Error(this.UNAVAILABLE_ERROR);
  }
  return amount / this.rates[code] / this.SAT_TO_BTC;
};

RateService.prototype.listAlternatives = function() {
  if (!this.isAvailable) {
    throw new Error(this.UNAVAILABLE_ERROR);
  }

  var alts = [];
  this.alternatives.forEach(function(element) {
    alts.push({
      name: element.name,
      isoCode: element.isoCode
    });
  });
  return alts;
};

angular.module('copayApp.services').service('rateService', RateService);
