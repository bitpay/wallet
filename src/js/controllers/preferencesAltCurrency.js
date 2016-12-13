'use strict';

angular.module('copayApp.controllers').controller('preferencesAltCurrencyController',
  function($scope, $log, $timeout, $ionicHistory, configService, rateService, lodash, profileService, walletService, storageService) {

    var next = 10;
    var completeAlternativeList;

    var unusedCurrencyList = [{
      isoCode: 'LTL'
    }, {
      isoCode: 'BTC'
    }];

    function init() {
      var config = configService.getSync();
      $scope.currentCurrency = config.wallet.settings.alternativeIsoCode;

      rateService.whenAvailable(function() {
        storageService.getLastCurrencyUsed(function(err, lastUsedAltCurrency) {

          $scope.lastUsedAltCurrencyList = JSON.parse(lastUsedAltCurrency) || [];

          var idx = lodash.indexBy(unusedCurrencyList, 'isoCode');
          var idx2 = lodash.indexBy($scope.lastUsedAltCurrencyList, 'isoCode');

          $scope.completeAlternativeList = lodash.reject(rateService.listAlternatives(), function(c) {
            return idx[c.isoCode] || idx2[c.isoCode];
          });
          $scope.altCurrencyList = $scope.completeAlternativeList;
        });
      });
    }

    $scope.findCurrency = function(search) {
      if (!search) init();
      $scope.altCurrencyList = lodash.filter($scope.completeAlternativeList, function(item) {
        var val = item.name;
        return lodash.includes(val.toLowerCase(), search.toLowerCase());
      });
      $timeout(function() {
        $scope.$apply();
      });
    };

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

        $ionicHistory.goBack();
        saveLastUsed(newAltCurrency);
        walletService.updateRemotePreferences(profileService.getWallets(), {}, function() {
          $log.debug('Remote preferences saved');
        });
      });
    };

    function saveLastUsed(newAltCurrency) {
      $scope.lastUsedAltCurrencyList.unshift(newAltCurrency);
      $scope.lastUsedAltCurrencyList = $scope.lastUsedAltCurrencyList.slice(0, 5);
      $scope.lastUsedAltCurrencyList = lodash.uniq($scope.lastUsedAltCurrencyList, 'isoCode');
      storageService.setLastCurrencyUsed(JSON.stringify($scope.lastUsedAltCurrencyList), function() {});
    };

    init();
  });
