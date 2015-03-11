'use strict';

angular.module('copayApp.services').factory('configService', function(localStorageService, lodash) {
  var root = {};

  var defaultConfig = {
    // wallet limits
    limits: {
      totalCopayers: 6,
      mPlusN: 100,
    },

    // Bitcore wallet service URL
    bws: {
      url: 'http://localhost:3001/copay/api',
    },

    // wallet default config
    wallet: {
      requiredCopayers: 2,
      totalCopayers: 3,
      spendUnconfirmed: true,
      reconnectDelay: 5000,
      idleDurationMin: 4,
      settings: {
        unitName: 'bits',
        unitToSatoshi: 100,
        unitDecimals: 2,
        alternativeName: 'US Dollar',
        alternativeIsoCode: 'USD',
      }
    },

    // local encryption/security config
    passphraseConfig: {
      iterations: 5000,
      storageSalt: 'mjuBtGybi/4=',
    },

    rates: {
      url: 'https://insight.bitpay.com:443/api/rates',
    },
  };

  root.get = function() {
    var localConfig = localStorageService.get('config');
    if (!localConfig) {
      return defaultConfig;
    }
    else {
      return localConfig;
    }
  };

  root.set = function(newOpts) {
    var config = defaultConfig;
    var oldOpts = {};
    oldOpts = localStorageService.get('config');
    lodash.assign(newOpts, config, oldOpts);
    return localStorageService.set('config', JSON.stringify(newOpts));
  };

  root.reset = function() {
    return localStorageService.remove('config');
  };

  return root;
});
