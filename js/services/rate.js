'use strict';

var request = require('request');

var RateService = function() {
  this.isAvailable = false;
  this.SAT_TO_BTC = 1 / 1e8;
  this.queued = [];
  this.alternatives = [];
  var that = this;
  var backoff = 5;
  var retrieve = function() {
    request.get({
      url:'https://bitpay.com/api/rates',
      json: true
    }, function(err, response, listOfCurrencies) {
      if (err) {
        backoff *= 1.5;
        setTimeout(retrieve, backoff * 1000);
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
        setTimeout(callback, 0);
      });
    });
  };
  retrieve();
};

RateService.prototype.whenAvailable = function(callback) {
  if (this.isAvailable) {
    setTimeout(callback, 0);
  } else {
    this.queued.push(callback);
  }
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

RateService.prototype.listAlternatives = function() {
  if (!this.isAvailable) {
    return [];
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
