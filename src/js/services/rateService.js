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
  self.storageService = opts.storageService;
  self.CUSTOMNETWORKS = opts.CUSTOMNETWORKS;
  self.defaults = opts.defaults;
  self.wallets = opts.wallets;

  self.SAT_TO_BTC = 1 / 1e8;
  self.BTC_TO_SAT = 1e8;
  self.UNAVAILABLE_ERROR = 'Service is not available - check for service.isAvailable() or use service.whenAvailable()';
  self.UNSUPPORTED_CURRENCY_ERROR = 'Currency not supported';

  self._isAvailable = false;
  self._rates = {};
  self._alternatives = {};
  self.networks = {};
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


  var retrieveOne = function(network, cb) {
    // console.info('Fetching exchange rates', network);
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

    self.storageService.getCustomNetworks(function(err, networkListRaw) {

      for(var i in self.wallets) {
        if(self.CUSTOMNETWORKS[self.wallets[i].network]) {
          self.networks[self.wallets[i].network] = self.CUSTOMNETWORKS[self.wallets[i].network]
        }
      }
      for (var c in self.CUSTOMNETWORKS) {
        self.networks[self.CUSTOMNETWORKS[c].name] = self.CUSTOMNETWORKS[c]
      }
      if(networkListRaw) {
        var networkList = JSON.parse(networkListRaw)
        for (var n in networkList) {
           self.networks[networkList[n].name] = networkList[n]
        }      
      }
      for (var i in self.networks) {
        if(!self._rates[self.networks[i].name]) {
          self._rates[self.networks[i].name] = []
          self._alternatives[self.networks[i].name] = []
        }
      }      
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
    })
  }



  retrieve();
};

RateService.prototype.getRate = function(code, network) {
  if(!network) {
    network = this.networks['livenet']
  }

  if(!this._rates[network.name]) {
    return console.error("rate service unavailable as yet.",network.name)
  }
  return this._rates[network.name][code];
};

RateService.prototype.getAlternatives = function(network) {
  if(!network) {
    network = this.networks['livenet']
  }  
  if(!this._alternatives[network.name]) {
    return console.error("rate service unavailable as yet.",network.name)
  }
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

angular.module('copayApp.services').factory('rateService', function($http, lodash, configService, profileService, CUSTOMNETWORKS, storageService) {
  // var cfg = _.extend(config.rates, {
  //   httprequest: $http
  // });
  var wallets = profileService.getWallets();
  var defaults = configService.getDefaults()

    var cfg = {
      httprequest: $http,
      lodash: lodash,
      CUSTOMNETWORKS: CUSTOMNETWORKS,
      storageService: storageService,
      defaults: defaults,
      wallets: wallets
    };
    return RateService.singleton(cfg);    
  });
