'use strict';

angular.module('copayApp.controllers').controller('preferencesUnitController',
  function($scope, $timeout, $log, configService, go, walletService, profileService) {
    var config = configService.getSync();
    this.unitName = config.wallet.settings.unitName;
    this.unitOpts = [
      // TODO : add Satoshis to bitcore-wallet-client formatAmount()
      // {
      //     name: 'Satoshis (100,000,000 satoshis = 1BTC)',
      //     shortName: 'SAT',
      //     value: 1,
      //     decimals: 0,
      //     code: 'sat',
      //   }, 
      {
        name: 'bits (1,000,000 bits = 1BTC)',
        shortName: 'bits',
        value: 100,
        decimals: 2,
        code: 'bit',
      }
      // TODO : add mBTC to bitcore-wallet-client formatAmount()
      // ,{
      //   name: 'mBTC (1,000 mBTC = 1BTC)',
      //   shortName: 'mBTC',
      //   value: 100000,
      //   decimals: 5,
      //   code: 'mbtc',
      // }
      , {
        name: 'BTC',
        shortName: 'BTC',
        value: 100000000,
        decimals: 8,
        code: 'btc',
      }
    ];

    this.save = function(newUnit) {
      var opts = {
        wallet: {
          settings: {
            unitName: newUnit.shortName,
            unitToSatoshi: newUnit.value,
            unitDecimals: newUnit.decimals,
            unitCode: newUnit.code,
          }
        }
      };
      this.unitName = newUnit.shortName;

      configService.set(opts, function(err) {
        if (err) $log.warn(err);
        go.preferencesGlobal();
        $scope.$emit('Local/UnitSettingUpdated');
        walletService.updateRemotePreferences(profileService.getClients(), {}, function() {
          $log.debug('Remote preferences saved')
        });
        $timeout(function() {
          $scope.$apply();
        }, 100);
      });

    };
  });
