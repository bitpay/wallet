'use strict';

angular.module('copayApp.services').factory('feeService', function($log, $timeout, $stateParams, bwcService, walletService, configService, gettext, lodash, txFormatService, gettextCatalog, CUSTOMNETWORKS) {

  var root = {};
<<<<<<< HEAD

  var CACHE_TIME_TS = 60; // 1 min

=======
  var defaults = configService.getDefaults()
>>>>>>> default network config
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

<<<<<<< HEAD

  root.getFeeRate = function(network, feeLevel, cb) {

    if (feeLevel == 'custom') return cb();

    network = network || 'livenet';
=======
  root.getCurrentFeeValue = function(network, cb) {
    network = network || defaults.defaultNetwork;
    var feeLevel = root.getCurrentFeeLevel();
>>>>>>> default network config

    root.getFeeLevels(function(err, levels, fromCache) {
      if (err) return cb(err);

<<<<<<< HEAD
      var feeLevelRate = lodash.find(levels[network], {
=======
      var feeLevelValue = lodash.find(levels[defaults.defaultNetwork], { //hardcode livenet here
>>>>>>> default network config
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
    return root.getFeeRatenetwork, root.getCurrentFeeLevel(), cb);
  };

  root.getFeeLevels = function(cb) {

    if (cache.updateTs > Date.now() - CACHE_TIME_TS * 1000) {
      return cb(null, cache.data, true);
    }

    network = network || defaults.defaultNetwork;

    var walletClient = bwcService.getClient(null, {bwsurl:CUSTOMNETWORKS[network].bwsUrl});

    var unitName = configService.getSync().wallet.settings.unitName;

    walletClient.getFeeLevels('livenet', function(errLivenet, levelsLivenet) {
      walletClient.getFeeLevels('testnet', function(errTestnet, levelsTestnet) {
        if (errLivenet || errTestnet) {
          return cb(gettextCatalog.getString('Could not get dynamic fee'));
        }
        cache.updateTs = Date.now();
        walletClient.getFeeLevels(defaults.networkName, function(errDefaultnet, levelsDefaultnet) {
          var retObj = {
            'livenet': levelsLivenet,
            'testnet': levelsTestnet
          };
          retObj[defaults.networkName] = levelsDefaultnet
          
          return cb(null, retObj);
        });
      });
    });
  };


  return root;
});
