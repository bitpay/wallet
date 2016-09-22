'use strict';

angular.module('copayApp.controllers').controller('preferencesAltCurrencyController',
  function($scope, $log, $timeout, $ionicHistory, gettextCatalog, configService, rateService, lodash, profileService, walletService) {

    var next = 10;
    var completeAlternativeList;

    var config = configService.getSync();
    $scope.currentCurrency = config.wallet.settings.alternativeIsoCode;
    $scope.listComplete = false;

    rateService.whenAvailable(function() {
      completeAlternativeList = rateService.listAlternatives();
      lodash.remove(completeAlternativeList, function(c) {
        return c.isoCode == 'BTC';
      });
      $scope.altCurrencyList = completeAlternativeList.slice(0, next);
    });

    $scope.loadMore = function() {
      $timeout(function() {
        $scope.altCurrencyList = completeAlternativeList.slice(0, next);
        next += 10;
        $scope.listComplete = $scope.altCurrencyList.length >= completeAlternativeList.length;
        $scope.$broadcast('scroll.infiniteScrollComplete');
      }, 100);
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
        walletService.updateRemotePreferences(profileService.getWallets(), {}, function() {
          $log.debug('Remote preferences saved');
        });
      });
    };
  });
