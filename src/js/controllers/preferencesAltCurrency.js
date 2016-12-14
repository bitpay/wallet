'use strict';

angular.module('copayApp.controllers').controller('preferencesAltCurrencyController',
  function($scope, $log, $timeout, $ionicHistory, configService, rateService, lodash, profileService, walletService, storageService) {

    function init() {
      var unusedCurrencyList = [{
        isoCode: 'LTL'
      }, {
        isoCode: 'BTC'
      }];
      rateService.whenAvailable(function() {

        var idx = lodash.indexBy(unusedCurrencyList, 'isoCode');
        var idx2 = lodash.indexBy($scope.lastUsedAltCurrencyList, 'isoCode');

        $scope.completeAlternativeList = lodash.reject(rateService.listAlternatives(), function(c) {
          return idx[c.isoCode] || idx2[c.isoCode];
        });
        $scope.altCurrencyList = $scope.completeAlternativeList;
        $timeout(function() {
          $scope.$apply();
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
      $scope.lastUsedAltCurrencyList = lodash.uniq($scope.lastUsedAltCurrencyList, 'isoCode');
      $scope.lastUsedAltCurrencyList = $scope.lastUsedAltCurrencyList.slice(0, 3);
      storageService.setLastCurrencyUsed(JSON.stringify($scope.lastUsedAltCurrencyList), function() {});
    };

    $scope.$on("$ionicView.beforeEnter", function(event, data) {
      var config = configService.getSync();
      $scope.currentCurrency = config.wallet.settings.alternativeIsoCode;
      storageService.getLastCurrencyUsed(function(err, lastUsedAltCurrency) {
        $scope.lastUsedAltCurrencyList = lastUsedAltCurrency ? JSON.parse(lastUsedAltCurrency) : [];
        $timeout(function() {
          $scope.$apply();
        });
      });
    });

    $scope.$on("$ionicView.enter", function(event, data) {
      $timeout(function() {
        init();
      });
    });
  });
