'use strict';

angular.module('copayApp.controllers').controller('addressesController', function($scope, $stateParams, $timeout, $ionicScrollDelegate, configService, popupService, gettextCatalog, ongoingProcess, lodash, profileService, walletService) {
  var UNUSED_ADDRESS_LIMIT = 5;
  var BALANCE_ADDRESS_LIMIT = 5;
  var config;
  var unitName;
  var unitToSatoshi;
  var satToUnit;
  var unitDecimals;
  var withBalance;
  var noBalance;
  $scope.showInfo = false;
  $scope.wallet = profileService.getWallet($stateParams.walletId);

  function init() {
    ongoingProcess.set('extractingWalletInfo', true);
    walletService.getMainAddresses($scope.wallet, {}, function(err, addresses) {
      if (err) {
        ongoingProcess.set('extractingWalletInfo', false);
        return popupService.showAlert(gettextCatalog.getString('Error'), err);
      }

      var allAddresses = addresses;

      walletService.getBalance($scope.wallet, {}, function(err, resp) {
        ongoingProcess.set('extractingWalletInfo', false);
        if (err) {
          return popupService.showAlert(gettextCatalog.getString('Error'), err);
        }

        withBalance = resp.byAddress;
        var idx = lodash.indexBy(withBalance, 'address');
        noBalance = lodash.reject(allAddresses, function(x) {
          return idx[x.address];
        });

        processPaths(noBalance);
        processPaths(withBalance);

        $scope.latestUnused = lodash.slice(noBalance, 0, UNUSED_ADDRESS_LIMIT);
        $scope.latestWithBalance = lodash.slice(withBalance, 0, BALANCE_ADDRESS_LIMIT);

        lodash.each(withBalance, function(a) {
          a.balanceStr = (a.amount * satToUnit).toFixed(unitDecimals) + ' ' + unitName;
        });

        $scope.viewAll = {
          value: noBalance.length > UNUSED_ADDRESS_LIMIT || withBalance.length > BALANCE_ADDRESS_LIMIT
        };
        $scope.allAddresses = noBalance.concat(withBalance);
        $scope.$digest();
      });
    });
  };

  function processPaths(list) {
    lodash.each(list, function(n) {
      n.path = n.path.replace(/^m/g, 'xpub');
    });
  };

  $scope.showInformation = function() {
    $timeout(function() {
      $scope.showInfo = !$scope.showInfo;
      $ionicScrollDelegate.resize();
    });
  };

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    config = configService.getSync().wallet.settings;
    unitToSatoshi = config.unitToSatoshi;
    satToUnit = 1 / unitToSatoshi;
    unitName = config.unitName;
    unitDecimals = config.unitDecimals;

    if (!$scope.allAddresses || $scope.allAddresses.length < 0) init();
  });
});
