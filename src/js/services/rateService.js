'use strict';

//var util = require('util');
//var _ = require('lodash');
//var log = require('../util/log');
//var preconditions = require('preconditions').singleton();
//var request = require('request');

/*
  This class lets interfaces with BitPay's exchange rate API.
*/

var RateService = function(opts) {
  var self = this;

  opts = opts || {};
  self.httprequest = opts.httprequest; // || request;
  self.lodash = opts.lodash;

  self.SAT_TO_BTC = 1 / 1e8;
  self.BTC_TO_SAT = 1e8;
  self.UNAVAILABLE_ERROR = 'Service is not available - check for service.isAvailable() or use service.whenAvailable()';
  self.UNSUPPORTED_CURRENCY_ERROR = 'Currency not supported';

  self._isAvailable = false;
  self._rates = {};
  self._alternatives = [];
  self._queued = [];

  self._fetchCurrencies();
};


var _instance;
RateService.singleton = function(opts) {
  if (!_instance) {
    _instance = new RateService(opts);
  }
  return _instance;
};

RateService.prototype._fetchCurrencies = function() {
  var self = this;

  var backoffSeconds = 5;
  var updateFrequencySeconds = 5 * 60;
  var btcRate
  var rateServiceUrl = 'https://bitpay.com/api/rates';
  var navRateServiceUrl = 'https://api.coinmarketcap.com/v1/ticker/nav-coin/'

  var retrieve = function() {
    //log.info('Fetching exchange rates');
    self.httprequest.get(navRateServiceUrl).success(function(res){
      btcRate = res[0].price_btc;
      self.httprequest.get(rateServiceUrl).success(function(res) {
        self.lodash.each(res, function(currency) {
          self._rates[currency.code] = parseFloat(currency.rate) * parseFloat(btcRate);
          self._alternatives.push({
            name: currency.name,
            isoCode: currency.code,
            rate: parseFloat(currency.rate) * parseFloat(btcRate)
          });
        });
        self._isAvailable = true;
        self.lodash.each(self._queued, function(callback) {
          setTimeout(callback, 1);
        });
        setTimeout(retrieve, updateFrequencySeconds * 1000);
      }).error(function(err) {
        //log.debug('Error fetching exchange rates', err);
        setTimeout(function() {
          backoffSeconds *= 1.5;
          retrieve();
        }, backoffSeconds * 1000);
        return;
      })}).error(function(err) {
      //log.debug('Error fetching exchange rates', err);
      setTimeout(function() {
        backoffSeconds *= 1.5;
        retrieve();
      }, backoffSeconds * 1000);
      return;
    });

  };

  retrieve();
};

RateService.prototype.getRate = function(code) {
  return this._rates[code];
};

RateService.prototype.getAlternatives = function() {
  return this._alternatives;
};

RateService.prototype.isAvailable = function() {
  return this._isAvailable;
};

RateService.prototype.whenAvailable = function(callback) {
  if (this.isAvailable()) {
    setTimeout(callback, 1);
  } else {
    this._queued.push(callback);
  }
};

RateService.prototype.toFiat = function(satoshis, code) {
  if (!this.isAvailable()) {
    return null;
  }

  return satoshis * this.SAT_TO_BTC * this.getRate(code);
};

RateService.prototype.fromFiat = function(amount, code) {
  if (!this.isAvailable()) {
    return null;
  }
  return amount / this.getRate(code) * this.BTC_TO_SAT;
};

RateService.prototype.listAlternatives = function(sort) {
  var self = this;
  if (!this.isAvailable()) {
    return [];
  }

  var alternatives = self.lodash.map(this.getAlternatives(), function(item) {
    return {
      name: item.name,
      isoCode: item.isoCode
    }
  });
  if (sort) {
    alternatives.sort(function(a, b) {
      return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1;
    });
  }
  return self.lodash.uniq(alternatives, 'isoCode');
};

angular.module('copayApp.services').factory('rateService', function($http, lodash) {
  // var cfg = _.extend(config.rates, {
  //   httprequest: $http
  // });

  var cfg = {
    httprequest: $http,
    lodash: lodash
  };
  return RateService.singleton(cfg);
});
