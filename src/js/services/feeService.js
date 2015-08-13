'use strict';

angular.module('copayApp.services').factory('feeService', function($log, profileService, configService, gettextCatalog, lodash) {
  var root = {};

  // Constant fee options to translate
  root.feeOpts = {
    priority: gettextCatalog.getString('Priority'),
    normal: gettextCatalog.getString('Normal'),
    economy: gettextCatalog.getString('Economy')
  };

  root.getCurrentFeeValue = function(currentSendFeeLevel, cb) { 
    var fc = profileService.focusedClient;
    var config = configService.getSync().wallet.settings;
    var feeLevel = currentSendFeeLevel || config.feeLevel || 'normal';
    // static fee
    var fee = 10000;
    fc.getFeeLevels(fc.credentials.network, function(err, levels) {
      if (err) {
        return cb({message: 'Could not get dynamic fee. Using static 10000sat'}, fee);
      }
      else {
        fee = lodash.find(levels, { level: feeLevel }).feePerKB;
        $log.debug('Dynamic fee: ' + feeLevel + ' ' + fee +  ' SAT');
        return cb(null, fee); 
      }
    });
  }; 

  root.getFeeLevels = function(cb) { 
    var fc = profileService.focusedClient;
    var config = configService.getSync().wallet.settings;
    var unitName = config.unitName;

    fc.getFeeLevels('livenet', function(errLivenet, levelsLivenet) {
      fc.getFeeLevels('testnet', function(errTestnet, levelsTestnet) {
        if (errLivenet || errTestnet) $log.debug('Could not get dynamic fee');
        else {
          for (var i = 0; i < 3; i++) {
            levelsLivenet[i]['feePerKBUnit'] = profileService.formatAmount(levelsLivenet[i].feePerKB) + ' ' + unitName;
            levelsTestnet[i]['feePerKBUnit'] = profileService.formatAmount(levelsTestnet[i].feePerKB) + ' ' + unitName;
          }
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
