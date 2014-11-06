'use strict';

var util = require('util');
var _ = require('lodash');
var log = require('../log');
var preconditions = require('preconditions').singleton();
var request = require('request');

/*
  This class lets interfaces with BitPay's exchange rate API.
*/

var RateService = function(opts) {
  var self = this;

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

  log.info('Fetching exchange rates');

  var backoffSeconds = 5;
  var updateFrequencySeconds = 3600;
  var rateServiceUrl = 'https://bitpay.com/api/rates';

  request.get({
    url: rateServiceUrl,
    json: true
  }, function(err, res, body) {
    if (err || !body) {
      backoffSeconds *= 1.5;
      setTimeout(retrieve, backoffSeconds * 1000);
      return;
    }
    _.each(body, function(currency) {
      self._rates[currency.code] = currency.rate;
      self._alternatives.push({
        name: currency.name,
        isoCode: currency.code,
        rate: currency.rate
      });
    });
    self._isAvailable = true;
    _.each(self._queued, function(callback) {
      setTimeout(callback, 1);
    });
    setTimeout(function() {
      self._fetchCurrencies()
    }, updateFrequencySeconds * 1000);
  });
};

RateService.prototype._getRate = function(code) {
  return this._rates[code];
};

RateService.prototype._getHistoricRate = function(code, date, cb) {
  // TODO (isocolsky): implement with a remote call
  return cb(new Error('Not implemented'));
};

RateService.prototype._getAlternatives = function() {
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
    throw new Error(this.UNAVAILABLE_ERROR);
  }
  return satoshis * this.SAT_TO_BTC * this._getRate(code);
};

RateService.prototype.toFiatHistoric = function(satoshis, code, date, cb) {
  var self = this;

  self._getHistoricRate(code, date, function(err, rate) {
    if (err) return cb(err);
    return cb(null, satoshis * self.SAT_TO_BTC * rate);
  });
};

RateService.prototype.fromFiat = function(amount, code) {
  if (!this.isAvailable()) {
    throw new Error(this.UNAVAILABLE_ERROR);
  }
  return amount / this._getRate(code) * this.BTC_TO_SAT;
};

RateService.prototype.listAlternatives = function() {
  if (!this.isAvailable()) {
    throw new Error(this.UNAVAILABLE_ERROR);
  }

  return _.map(this._getAlternatives(), function(item) {
    return {
      name: item.name,
      isoCode: item.isoCode
    }
  });
};


module.exports = RateService;
