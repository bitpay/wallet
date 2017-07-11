'use strict';

angular.module('copayApp.services').factory('feeService', function($log, $timeout, $stateParams, bwcService, walletService, configService, gettext, lodash, txFormatService, gettextCatalog) {
  var root = {};

  var CACHE_TIME_TS = 60; // 1 min

  // Constant fee options to translate
  root.feeOpts = {
    urgent: gettext('Urgent'),
    priority: gettext('Priority'),
    normal: gettext('Normal'),
    economy: gettext('Economy'),
    superEconomy: gettext('Super Economy'),
    custom: gettext('Custom')
  };

  var cache = {
    updateTs: 0,
  };

  root.getCurrentFeeLevel = function() {
    return configService.getSync().wallet.settings.feeLevel || 'normal';
  };


  root.getFeeRate = function(network, feeLevel, cb) {

    if (feeLevel == 'custom') return cb();

    network = network || 'livenet';

    root.getFeeLevels(function(err, levels, fromCache) {
      if (err) return cb(err);

      var feeLevelRate = lodash.find(levels[network], {
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

      if (!fromCache) $log.debug('Dynamic fee: ' + feeLevel + '/' + network + ' ' + (feeLevelRate.feePerKB / 1000).toFixed() + ' SAT/B');

      return cb(null, feeRate);
    });
  };

  root.getCurrentFeeRate = function(network, cb) {
    return root.getFeeRate(network, root.getCurrentFeeLevel(), cb);
  };

  root.getFeeLevels = function(cb) {

    if (cache.updateTs > Date.now() - CACHE_TIME_TS * 1000) {
      return cb(null, cache.data, true);
    }

    var walletClient = bwcService.getClient();
    var unitName = configService.getSync().wallet.settings.unitName;

    walletClient.getFeeLevels('livenet', function(errLivenet, levelsLivenet) {
      walletClient.getFeeLevels('testnet', function(errTestnet, levelsTestnet) {
        if (errLivenet || errTestnet) {
          return cb(gettextCatalog.getString('Could not get dynamic fee'));
        }

        cache.updateTs = Date.now();
        cache.data = {
          'livenet': levelsLivenet,
          'testnet': levelsTestnet
        };

        return cb(null, cache.data);
      });
    });
  };


  return root;
});
