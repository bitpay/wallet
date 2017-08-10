'use strict';

angular.module('copayApp.services').factory('feeService', function($log, bwcService, configService, gettext, lodash, gettextCatalog, networkHelper) {
  var root = {};

  var CACHE_TIME_TS = 60; // 1 min

  var cache = {
    updateTs: 0,
  };

  root.getFeeOpts = function(networkURI, opt) {
    var options = networkHelper.getNetworkByName(networkURI).feePolicy.options;
    if (!opt) {
      return options;
    } else {
      return options[opt];
    }
  };

  root.getCurrentFeeLevel = function(networkURI) {
    return configService.getSync().currencyNetworks[networkURI].feeLevel;
  };

  root.getFeeRate = function(networkURI, feeLevel, cb) {

    if (feeLevel == 'custom') return cb();

    root.getFeeLevels(networkURI, function(err, levels, fromCache) {
      if (err) return cb(err);

      var feeLevelRate = lodash.find(levels, {
        level: feeLevel
      });

      if (!feeLevelRate || !feeLevelRate.feePerKB) {
        return cb({
          message: gettextCatalog.getString("Could not get dynamic fee for level: {{feeLevel}}", {
            feeLevel: feeLevel
          })
        });
      }

      var feeRate = feeLevelRate.feePerKB;

      if (!fromCache) $log.debug('Dynamic fee: ' + feeLevel + '/' + networkURI + ' ' + (feeLevelRate.feePerKB / 1000).toFixed() + ' ' + networkHelper.getAtomicUnit(networkURI).shortname + ' / byte');

      return cb(null, feeRate);
    });
  };

  root.getCurrentFeeRate = function(networkURI, cb) {
    return root.getFeeRate(networkURI, root.getCurrentFeeLevel(networkURI), cb);
  };

  root.getFeeLevels = function(networkURI, cb) {

    if (cache.updateTs > Date.now() - CACHE_TIME_TS * 1000) {
      return cb(null, cache.data, true);
    }

    var walletClient = bwcService.getClient();
    walletClient.getFeeLevels(networkURI, function(err, levels) {
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
