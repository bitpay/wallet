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
  self.networks = opts.networks;

  self.SAT_TO_BTC = 1 / 1e8;
  self.BTC_TO_SAT = 1e8;
  self.UNAVAILABLE_ERROR = 'Service is not available - check for service.isAvailable() or use service.whenAvailable()';
  self.UNSUPPORTED_CURRENCY_ERROR = 'Currency not supported';

  self._isAvailable = false;
  self._rates = {'aur': 9, 'deus': 0.11};
  self._alternatives = {};
  self._queued = {};

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


  var retrieveOne = function(network, cb) {
    //log.info('Fetching exchange rates');
    self.httprequest.get(network.ratesUrl).success(function(res) {
      self.lodash.each(res, function(currency) {
        self._rates[network.name][currency.code] = currency.rate;
        self._alternatives[network.name].push({
          name: currency.name,
          isoCode: currency.code,
          rate: currency.rate
        });
      });
      cb()
    }).error(function(err) {
      //log.debug('Error fetching exchange rates', err);
      return cb(new Error("error retrieving at least one rate table"))
    });
  };
  var retrieve = function() {
    var length = Object.keys(self.networks).length;
    var done = 0
    for(var i in self.networks) {
      retrieveOne(self.networks[i], function(err) {
        done++
        if(err) {
          setTimeout(function() {
            backoffSeconds *= 1.2
            retrieve();
          }, backoffSeconds * 1000);
        } else if(done === length) {
          self._isAvailable = true;
          self.lodash.each(self._queued, function(callback) {
            setTimeout(callback, 1);
          });
          setTimeout(retrieve, updateFrequencySeconds * 1000);          
        }
      })
    }
  }
  retrieve();
};

RateService.prototype.getRate = function(code, network) {
  return this._rates[network.name][code];
};

RateService.prototype.getAlternatives = function(network) {
  return this._alternatives[network.name];
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

RateService.prototype.toFiat = function(satoshis, code, network) {
  if (!this.isAvailable()) {
    return null;
  }

  return satoshis * this.SAT_TO_BTC * this.getRate(code, network);
};

RateService.prototype.fromFiat = function(amount, code, network) {
  if (!this.isAvailable()) {
    return null;
  }
  return amount / this.getRate(code, network) * this.BTC_TO_SAT;
};

RateService.prototype.listAlternatives = function(sort, network) {
  var self = this;
  if (!this.isAvailable()) {
    return [];
  }

  var alternatives = self.lodash.map(this.getAlternatives(network), function(item) {
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

angular.module('copayApp.services').factory('rateService', function($http, lodash, configService, profileService, CUSTOMNETWORKS) {
  // var cfg = _.extend(config.rates, {
  //   httprequest: $http
  // });
  var wallets = profileService.getWallets();
  var rateServices = []
  var defaults = configService.getDefaults()
  var networks = {};
  for(var i in wallets) {
    if(CUSTOMNETWORKS[wallets[i].network]) {
      networks[wallets[i].network] = CUSTOMNETWORKS[wallets[i].network]
    }
  }
  storageService.getCustomNetworks(function(err, networkListRaw) {
    if(!networkListRaw) {
      return;
    }
    var networkList = JSON.parse(networkListRaw)
    for (var n in networkList) {
       networks[networkList[n].name] = networkList[n]
    }
  })
  var cfg = {
    httprequest: $http,
    lodash: lodash,
    networks: networks
  };
  return RateService.singleton(cfg);
});
