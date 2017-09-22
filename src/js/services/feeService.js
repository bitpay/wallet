'use strict';

angular.module('copayApp.services').factory('feeService', function($log, $timeout, $stateParams, bwcService, walletService, configService, gettext, lodash, txFormatService, gettextCatalog, customNetworks) {

  var root = {};
  var CACHE_TIME_TS = 60; // 1 min
  var defaults = configService.getDefaults()

  // Constant fee options to translate
  root.feeOpts = {
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
    network = network || defaults.defaultNetwork.name;
    if (feeLevel == 'custom') return cb();

    root.getFeeLevels(network, function(err, levels, fromCache) {
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

  root.getFeeLevels = function(network, cb) {
    if (cache.updateTs > Date.now() - CACHE_TIME_TS * 1000) {
      return cb(null, cache.data, true);
    }

    var CUSTOMNETWORKS = customNetworks.getStatic()

    var length = Object.keys(CUSTOMNETWORKS).length;

    var count = 0;
    var retObj = {};        
    for (var c in CUSTOMNETWORKS) {
      // console.log(CUSTOMNETWORKS[c])
      count++
      var thiswall = bwcService.getClient(null, {bwsurl:CUSTOMNETWORKS[c].bwsUrl});
      thiswall.getFeeLevels(CUSTOMNETWORKS[c].name, function(errThis, levelsThis) { // getFeeLevels(CUSTOMNETWORKS[c].name
        // console.log(CUSTOMNETWORKS[levelsThis.network].bwsUrl,levelsThis)
        if (errThis) {
          return cb(gettextCatalog.getString('Could not get dynamic fee'));
        }        
        retObj[levelsThis.network] = levelsThis
        cache.data = retObj;
        if(count === length) { 
          cache.updateTs = Date.now();
          return cb(null, retObj); 
        }
      });
    }
  };


  return root;
});
