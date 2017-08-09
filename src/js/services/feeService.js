'use strict';

angular.module('copayApp.services').factory('feeService', function($log, bwcService, configService, gettext, lodash, gettextCatalog, networkHelper) {
  var root = {};

  var CACHE_TIME_TS = 60; // 1 min

  var cache = {
    updateTs: 0,
  };

  root.getFeeOpts = function(networkName, opt) {
    var options = networkHelper.getNetworkByName(networkName).feePolicy.options;
    if (!opt) {
      return options;
    } else {
      return options[opt];
    }
  };

  root.getCurrentFeeLevel = function(networkName) {
    return configService.getSync().currencyNetworks[networkName].feeLevel;
  };

  root.getFeeRate = function(networkName, feeLevel, cb) {

    if (feeLevel == 'custom') return cb();

    root.getFeeLevels(networkName, function(err, levels, fromCache) {
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

      if (!fromCache) $log.debug('Dynamic fee: ' + feeLevel + '/' + networkName + ' ' + (feeLevelRate.feePerKB / 1000).toFixed() + ' ' + networkHelper.getAtomicUnit(networkName).shortname + ' / byte');

      return cb(null, feeRate);
    });
  };

  root.getCurrentFeeRate = function(networkName, cb) {
    return root.getFeeRate(networkName, root.getCurrentFeeLevel(networkName), cb);
  };

  root.getFeeLevels = function(networkName, cb) {

    if (cache.updateTs > Date.now() - CACHE_TIME_TS * 1000) {
      return cb(null, cache.data, true);
    }

    var walletClient = bwcService.getClient();
    walletClient.getFeeLevels(networkName, function(err, levels) {
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
