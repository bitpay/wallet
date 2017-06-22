'use strict';

angular.module('copayApp.services').factory('feeService', function($log, $timeout, $stateParams, bwcService, walletService, configService, gettext, lodash, txFormatService, gettextCatalog) {
  var root = {};

  var CACHE_TIME_TS = 60; // 1 min
  var LOW_AMOUNT_RATIO = 0.15; //Ratio low amount warning (econ fee/amount)

  // Constant fee options to translate
  root.feeOpts = {
    urgent: gettext('Urgent'),
    priority: gettext('Priority'),
    normal: gettext('Normal'),
    economy: gettext('Economy'),
    superEconomy: gettext('Super Economy')
  };

  var cache = {
    updateTs: 0,
  };

  root.getCurrentFeeLevel = function() {
    return configService.getSync().wallet.settings.feeLevel || 'normal';
  };


  root.getFeeRate = function(network, feeLevel, cb) {
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
      $timeout(function() {
        return cb(null, cache.data, true);
      }, 1);
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


  // These 2 functions were taken from
  // https://github.com/bitpay/bitcore-wallet-service/blob/master/lib/model/txproposal.js#L243

  function getEstimatedSizeForSingleInput(wallet) {
    switch (wallet.credentials.addressType) {
      case 'P2PKH':
        return 147;
      default:
      case 'P2SH':
        return wallet.m * 72 + wallet.n * 36 + 44;
    }
  };


  function getEstimatedSize(wallet) {
    // Note: found empirically based on all multisig P2SH inputs and within m & n allowed limits.
    var safetyMargin = 0.02;

    var overhead = 4 + 4 + 9 + 9;
    var inputSize = getEstimatedSizeForSingleInput(wallet);
    var outputSize = 34;
    var nbInputs = 1; //Assume 1 input
    var nbOutputs = 2; // Assume 2 outputs

    var size = overhead + inputSize * nbInputs + outputSize * nbOutputs;
    return parseInt((size * (1 + safetyMargin)).toFixed(0));
  };


  // Approx utxo amount, from which the uxto is economically redeemable  
  root.getLowAmount = function(wallet, cb) {
    root.getFeeLevels(function(err, levels) {
      if (err) return cb(err);

      var lowLevelRate = (lodash.find(levels[wallet.network], {
        level: 'economy',
      }).feePerKB / 1000).toFixed(0);

      var size = getEstimatedSize(wallet);

      var minFee = size * lowLevelRate;

      return cb(null, parseInt(minFee / (LOW_AMOUNT_RATIO)));
    });
  };

  return root;
});
