'use strict';

angular.module('copayApp.services').factory('feeService', function($log, bwcService, walletService, configService, gettext, lodash, txFormatService) {
  var root = {};

  // Constant fee options to translate
  root.feeOpts = {
    priority: gettext('Priority'),
    normal: gettext('Normal'),
    economy: gettext('Economy'),
    superEconomy: gettext('Super Economy')
  };

  root.getCurrentFeeLevel = function() {
    return configService.getSync().wallet.settings.feeLevel || 'normal';
  };

  root.getCurrentFeeValue = function(cb) {
console.log('[feeService.js.18:getCurrentFeeValue:] TODO TODO TODO'); //TODO
    // TODO TODO TODO
    var fc = walletService.focusedClient;
    var feeLevel = root.getCurrentFeeLevel();

    fc.getFeeLevels(fc.credentials.network, function(err, levels) {
      if (err)
        return cb({
          message: 'Could not get dynamic fee'
        });

      var feeLevelValue = lodash.find(levels, {
        level: feeLevel
      });
      if (!feeLevelValue || !feeLevelValue.feePerKB)
        return cb({
          message: 'Could not get dynamic fee for level: ' + feeLevel
        });

      var fee = feeLevelValue.feePerKB;
      $log.debug('Dynamic fee: ' + feeLevel + ' ' + fee + ' SAT');
      return cb(null, fee);
    });
  };

  root.getFeeLevels = function(cb) {
    var walletClient = bwcService.getClient();

    var unitName = configService.getSync().wallet.settings.unitName;

    walletClient.getFeeLevels('livenet', function(errLivenet, levelsLivenet) {
      walletClient.getFeeLevels('testnet', function(errTestnet, levelsTestnet) {
        if (errLivenet || errTestnet) $log.debug('Could not get dynamic fee');
        else {
          for (var i = 0; i < 4; i++) {
            levelsLivenet[i]['feePerKBUnit'] = txFormatService.formatAmount(levelsLivenet[i].feePerKB) + ' ' + unitName;
            levelsTestnet[i]['feePerKBUnit'] = txFormatService.formatAmount(levelsTestnet[i].feePerKB) + ' ' + unitName;
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
