'use strict';

angular.module('copayApp.services').factory('feeService', function($log, lodash, profileService, configService, gettext) {
  var root = {};

  root.feeStaticOpts = [{
    name: gettext('Priority'),
    level: 'priority',
    feePerKB: 10000,
    nbBlocks: 1
  }, {
    name: gettext('Normal'),
    level: 'normal',
    feePerKB: 5000,
    nbBlocks: 4
  }, {
    name: gettext('Economy'),
    level: 'economy',
    feePerKB: 1000,
    nbBlocks: 12
  }];

  root.getCurrentFeeValue = function(cb) { 
    var fc = profileService.focusedClient;
    var config = configService.getSync().wallet.settings;
    var feeLevel = config.feeLevel || 'priority';
    // static fee
    var fee = 10000;
    fc.getFeeLevels(fc.credentials.network, function(err, levels) {
      if (err) {
        return cb({message: 'Error getting dynamic fee'})
      }
      else {
        for (var i = 0; i < 3; i++) {
          if (levels[i].level == feeLevel) {
            fee = levels[i].feePerKB;
          }
        }
        $log.debug('Dynamic fee for ' + feeLevel + ': ' + fee);
        return cb(null, fee); 
      }
    });
  }; 

  var checkCompatibility = function(config) {
    if (config.feeName && !config.feeLevel) {
      // Migrate to new dynamic fee values
      var level = config.feeName.toLowerCase();
      if (level == 'emergency') level = 'priority';

      var opts = {
        wallet: {
          settings: {
            feeLevel: level
          }
        }
      };
      configService.set(opts, function(err) {
        if (err) $log.debug(err);
      });
    }
  };

  root.getFeeLevels = function(cb) { 
    var fc = profileService.focusedClient;
    var config = configService.getSync().wallet.settings;
    var unitName = config.unitName;
    checkCompatibility(config);

    fc.getFeeLevels('livenet', function(errLivenet, levelsLivenet) {
      fc.getFeeLevels('testnet', function(errTestnet, levelsTestnet) {
      if (errLivenet || errTestnet) $log.error('Error getting dynamic fee');

      for (var i = 0; i < 3; i++) {
        levelsLivenet[i]['feePerKBUnit'] = profileService.formatAmount(levelsLivenet[i].feePerKB) + ' ' + unitName;
        levelsTestnet[i]['feePerKBUnit'] = profileService.formatAmount(levelsTestnet[i].feePerKB) + ' ' + unitName;
      }

      return cb({
        'livenet': levelsLivenet,
        'testnet': levelsTestnet
      });
      });
    });
  };

  return root;
});
