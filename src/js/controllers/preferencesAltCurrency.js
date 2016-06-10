'use strict';

angular.module('copayApp.controllers').controller('preferencesAltCurrencyController',
  function($scope, $log, configService, rateService, lodash, go, profileService, walletService) {

    var config = configService.getSync();

    $scope.currentCurrency = {
      name: config.wallet.settings.alternativeName,
      isoCode: config.wallet.settings.alternativeIsoCode
    };

    rateService.whenAvailable(function() {
      $scope.altCurrencyList = rateService.listAlternatives();

      lodash.remove($scope.altCurrencyList, function(c) {
        return c.isoCode == 'BTC';
      });

      lodash.each($scope.altCurrencyList, function(altCurrency) {
        if (config.wallet.settings.alternativeIsoCode === altCurrency.isoCode)
          $scope.currentCurrency = altCurrency;
      });

      $scope.$digest();
    });

    $scope.save = function(newAltCurrency) {
      var opts = {
        wallet: {
          settings: {
            alternativeName: newAltCurrency.name,
            alternativeIsoCode: newAltCurrency.isoCode,
          }
        }
      };

      configService.set(opts, function(err) {
        if (err) $log.warn(err);
        go.preferencesGlobal();
        $scope.$emit('Local/UnitSettingUpdated');
        walletService.updateRemotePreferences(profileService.getClients(), {}, function() {
          $log.debug('Remote preferences saved');
        });
      });
    };
  });
