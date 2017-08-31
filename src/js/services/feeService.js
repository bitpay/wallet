'use strict';

angular.module('copayApp.services').factory('feeService', function($log, configService, gettext, lodash, gettextCatalog, networkService) {
  var root = {};

  var CACHE_TIME_TS = 60; // 1 min

  var cache = {
    updateTs: 0,
  };

  root.getFeeOpts = function(networkURI, opt) {
    var options = networkService.getNetworkByURI(networkURI).feePolicy.options;
    if (!opt) {
      return options;
    } else {
      return options[opt];
    }
  };

  root.getCurrentFeeLevel = function(networkURI) {
    return configService.getSync().currencyNetworks[networkURI].feeLevel;
  };

  root.getFeeRate = function(feeLevel, walletOrNetwork, cb) {
    var network = walletOrNetwork;
    if (typeof walletOrNetwork == 'object') {
      network = walletOrNetwork.network;
    }

    if (feeLevel == 'custom') return cb();

    root.getFeeLevels(walletOrNetwork, function(err, levels, fromCache) {
      if (err) return cb(err);

      var feeLevelRate = lodash.find(levels, {
        level: feeLevel
      });

      if (!feeLevelRate || !feeLevelRate.feePerKb) {
        return cb({
          message: gettextCatalog.getString("Could not get dynamic fee for level: {{feeLevel}}", {
            feeLevel: feeLevel
          })
        });
      }

      var feeRate = feeLevelRate.feePerKb;

      if (!fromCache) $log.debug('Dynamic fee: ' + feeLevel + '/' + network + ' ' + (feeLevelRate.feePerKb / 1000).toFixed() + ' ' + networkService.getAtomicUnit(network).shortname + ' / byte');

      return cb(null, feeRate);
    });
  };

  root.getCurrentFeeRate = function(walletOrNetwork, cb) {
    if (typeof walletOrNetwork == 'object') {
      network = walletOrNetwork.network;
    } else {
      network = walletOrNetwork;
    }
    return root.getFeeRate(root.getCurrentFeeLevel(network), walletOrNetwork, cb);
  };

  root.getFeeLevels = function(walletOrNetwork, cb) {
    var network;
    var bwsurl;

    if (typeof walletOrNetwork == 'object') {
      network = walletOrNetwork.network;
      bwsurl = walletOrNetwork.baseUrl;
    } else {
      network = walletOrNetwork;
      bwsurl = configService.getSync().currencyNetworks[network].bws.url;
    }

    if (cache.updateTs > Date.now() - CACHE_TIME_TS * 1000) {
      return cb(null, cache.data, true);
    }

    var opts = {
      bwsurl: bwsurl
    };

    var walletClient = networkService.bwcFor(network).getClient(null, opts);

    walletClient.getFeeLevels(network, function(err, levels) {
      if (err) {
        return cb(gettextCatalog.getString('Could not get dynamic fee'));
      }

      cache.updateTs = Date.now();
      cache.data = levels;

      return cb(null, cache.data);
    });
  };


  return root;
});
