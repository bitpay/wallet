'use strict';

angular.module('copayApp.controllers').controller('preferencesAltCurrencyController',
  function($scope, $log, $timeout, $ionicHistory, configService, rateService, lodash, profileService, walletService, storageService) {

    var next = 10;
    var completeAlternativeList = [];

    function init() {
      var unusedCurrencyList = [{
        isoCode: 'LTL'
      }, {
        isoCode: 'BTC'
      }];
      rateService.whenAvailable(function() {

        $scope.listComplete = false;

        var idx = lodash.indexBy(unusedCurrencyList, 'isoCode');
        var idx2 = lodash.indexBy($scope.lastUsedAltCurrencyList, 'isoCode');

        completeAlternativeList = lodash.reject(rateService.listAlternatives(true), function(c) {
          return idx[c.isoCode] || idx2[c.isoCode];
        });

        $scope.altCurrencyList = completeAlternativeList.slice(0, 10);

        $timeout(function() {
          $scope.$apply();
        });
      });
    }

    $scope.loadMore = function() {
      $timeout(function() {
        $scope.altCurrencyList = completeAlternativeList.slice(0, next);
        next += 10;
        $scope.listComplete = $scope.altCurrencyList.length >= completeAlternativeList.length;
        $scope.$broadcast('scroll.infiniteScrollComplete');
      }, 100);
    };

    $scope.findCurrency = function(search) {
      if (!search) init();
      $scope.altCurrencyList = lodash.filter(completeAlternativeList, function(item) {
        var val = item.name
        var val2 = item.isoCode;
        return lodash.includes(val.toLowerCase(), search.toLowerCase()) || lodash.includes(val2.toLowerCase(), search.toLowerCase());
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
        walletService.updateRemotePreferences(profileService.getWallets());
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
        init();
      });
    });
  });
