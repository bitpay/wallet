'use strict';

angular.module('copayApp.controllers').controller('preferencesAltCurrencyController',
  function($scope, $log, $timeout, $ionicHistory, configService, rateService, lodash, profileService, walletService, storageService, networkService) {

    var next = 10;
    var completeAlternativeList = [];
    var config = configService.getSync();

    function init() {
      var unusedCurrencyList = [{
        isoCode: 'LTL'
      }];

      // Add all currency network standard units to the unused list.
      var liveNetworks = networkService.getLiveNetworks();
      lodash.forEach(liveNetworks, function(n) {
        lodash.forEach(n.units, function(u) {
          if (u.kind == 'standard') {
            unusedCurrencyList.push({ isoCode: u.shortName});
          };
        });
      });

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
        var val = item.name;
        return lodash.includes(val.toLowerCase(), search.toLowerCase());
      });
      $timeout(function() {
        $scope.$apply();
      });
    };

    $scope.save = function(newAltCurrency) {
      var opts = {
        currencyNetworks: {}
      };

      opts.currencyNetworks[$scope.networkURI] = {
        alternativeName: newAltCurrency.name,
        alternativeIsoCode: newAltCurrency.isoCode,
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
      $scope.networkURI = data.stateParams.networkURI;
      if (!$scope.networkURI) {
        return;
      }

      var network = networkService.getNetworkByURI($scope.networkURI);
      $scope.currentCurrency = config.currencyNetworks[network.getURI()].alternativeIsoCode;

      storageService.getLastCurrencyUsed(function(err, lastUsedAltCurrency) {
        $scope.lastUsedAltCurrencyList = lastUsedAltCurrency ? JSON.parse(lastUsedAltCurrency) : [];
        init();
      });
    });
  });
