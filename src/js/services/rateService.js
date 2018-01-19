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
  self._ratesBCH = {};
  self._queued = [];

  self.updateRates();
};


var _instance;
RateService.singleton = function(opts) {
  if (!_instance) {
    _instance = new RateService(opts);
  }
  return _instance;
};

RateService.prototype.updateRates = function() {
  var self = this;

  var backoffSeconds = 5;
  var updateFrequencySeconds = 5 * 60;
  var rateServiceUrl = 'https://bitpay.com/api/rates';
  var bchRateServiceUrl = 'https://bitpay.com/api/rates/bch';


  function getBTC(cb, tries) {
    tries = tries || 0;
    if (!self.httprequest) return;
    if (tries > 5) return cb('could not get BTC rates');

    //log.info('Fetching exchange rates');
    self.httprequest.get(rateServiceUrl).success(function(res) {
      self.lodash.each(res, function(currency) {
        self._rates[currency.code] = currency.rate;
        self._alternatives.push({
          name: currency.name,
          isoCode: currency.code,
          rate: currency.rate
        });
      });

      return cb();
    }).error(function() {
      //log.debug('Error fetching exchange rates', err);
      setTimeout(function() {
        backoffSeconds *= 1.5;
        getBTC(cb, tries++);
      }, backoffSeconds * 1000);
      return;
    })
  }

  function getBCH(cb, tries) {
    tries = tries || 0;
    if (!self.httprequest) return;
    if (tries > 5) return cb('could not get BCH rates');

    self.httprequest.get(bchRateServiceUrl).success(function(res) {
      self.lodash.each(res, function(currency) {
        self._ratesBCH[currency.code] = currency.rate;
      });

      return cb();
    }).error(function() {
      //log.debug('Error fetching exchange rates', err);
      setTimeout(function() {
        backoffSeconds *= 1.5;
        getBCH(cb, tries++);
      }, backoffSeconds * 1000);
      return;
    })
  }

  getBTC(function(err) {
    if (err) return;
    getBCH(function(err) {
      if (err) return;

      self._isAvailable = true;
      self.lodash.each(self._queued, function(callback) {
        setTimeout(callback, 1);
      });
      setTimeout( self.updateRates  , updateFrequencySeconds * 1000);
    })
  })

};

RateService.prototype.getRate = function(code, chain) {
  if (chain == 'bch')
    return this._ratesBCH[code];
  else
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
    setTimeout(callback, 10);
  } else {
    this._queued.push(callback);
  }
};

RateService.prototype.toFiat = function(satoshis, code, chain) {
  if (!this.isAvailable()) {
    return null;
  }

  return satoshis * this.SAT_TO_BTC * this.getRate(code, chain);
};

RateService.prototype.fromFiat = function(amount, code, chain) {
  if (!this.isAvailable()) {
    return null;
  }
  return amount / this.getRate(code, chain) * this.BTC_TO_SAT;
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
