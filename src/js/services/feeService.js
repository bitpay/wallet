'use strict';

angular.module('copayApp.services').factory('feeService', function($log, $stateParams, bwcService, walletService, configService, gettext, lodash, txFormatService, gettextCatalog) {
  var root = {};

  // Constant fee options to translate
  root.feeOpts = {
    urgent: gettext('Urgent'),
    priority: gettext('Priority'),
    normal: gettext('Normal'),
    economy: gettext('Economy'),
    superEconomy: gettext('Super Economy')
  };

  root.getCurrentFeeLevel = function() {
    return configService.getSync().wallet.settings.feeLevel || 'normal';
  };

  root.getCurrentFeeValue = function(network, cb) {
    network = network || 'livenet';
    var feeLevel = root.getCurrentFeeLevel();

    root.getFeeLevels(function(err, levels) {
      if (err) return cb(err);

      var feeLevelValue = lodash.find(levels[network], {
        level: feeLevel
      });

      if (!feeLevelValue || !feeLevelValue.feePerKB) {
        return cb({
          message: gettextCatalog.getString("Could not get dynamic fee for level: {{feeLevel}}", {
            feeLevel: feeLevel
          })
        });
      }

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
        if (errLivenet || errTestnet) {
          return cb(gettextCatalog.getString('Could not get dynamic fee'));
        } else {
          for (var i = 0; i < 4; i++) {
            levelsLivenet[i]['feePerKBUnit'] = txFormatService.formatAmount(levelsLivenet[i].feePerKB) + ' ' + unitName;
            levelsTestnet[i]['feePerKBUnit'] = txFormatService.formatAmount(levelsTestnet[i].feePerKB) + ' ' + unitName;
          }
        }

        return cb(null, {
          'livenet': levelsLivenet,
          'testnet': levelsTestnet
        });
      });
    });
  };

  return root;
});
