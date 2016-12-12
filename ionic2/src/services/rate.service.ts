import { Injectable } from '@angular/core';
import lodash from 'lodash';

@Injectable()
export class RateService {

UNAVAILABLE_ERROR: string = 'Service is not available - check for service.isAvailable() or use service.whenAvailable()';
UNSUPPORTED_CURRENCY_ERROR: string = 'Currency not supported';

opts: any;
httprequest: any;
SAT_TO_BTC: number;
BTC_TO_SAT: number;

_isAvailable: boolean;
_rates: any;
_alternatives: any[];
_queued: any[];

constructor(opts?) {

  opts = opts || {};
  this.httprequest = opts.httprequest; // || request;
  //this.lodash = opts.lodash;

  this.SAT_TO_BTC = 1 / 1e8;
  this.BTC_TO_SAT = 1e8;


  this._isAvailable = false;
  this._rates = {};
  this._alternatives = [];
  this._queued = [];

  this.fetchCurrencies();
}

// _instance: any;
// singleton(opts) {
//   if (!_instance) {
//     _instance = new RateService(opts);
//   }
//   return _instance;
// };

fetchCurrencies() {
  var backoffSeconds = 5;
  var updateFrequencySeconds = 5 * 60;
  var rateServiceUrl = 'https://bitpay.com/api/rates';

  var retrieve = function() {
    //log.info('Fetching exchange rates');
    this.httprequest.get(rateServiceUrl).success(function(res) {
      lodash.each(res, function(currency) {
        this._rates[currency.code] = currency.rate;
        this._alternatives.push({
          name: currency.name,
          isoCode: currency.code,
          rate: currency.rate
        });
      });
      this._isAvailable = true;
      lodash.each(this._queued, function(callback) {
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
    });

  };

  retrieve();
};

getRate = function(code) {
  return this._rates[code];
};

getAlternatives = function() {
  return this._alternatives;
};

isAvailable = function() {
  return this._isAvailable;
};

whenAvailable = function(callback) {
  if (this.isAvailable()) {
    setTimeout(callback, 1);
  } else {
    this._queued.push(callback);
  }
};

toFiat = function(satoshis, code) {
  if (!this.isAvailable()) {
    return null;
  }

  return satoshis * this.SAT_TO_BTC * this.getRate(code);
};

fromFiat = function(amount, code) {
  if (!this.isAvailable()) {
    return null;
  }
  return amount / this.getRate(code) * this.BTC_TO_SAT;
};

listAlternatives = function() {
  if (!this.isAvailable()) {
    return [];
  }

  return lodash.map(this.getAlternatives(), function(item) {
    return {
      name: item.name,
      isoCode: item.isoCode
    };
  });
}
}
