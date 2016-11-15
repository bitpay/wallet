'use strict';

angular.module('copayApp.controllers').controller('addressesController', function($scope, $stateParams, $timeout, $ionicScrollDelegate, configService, popupService, gettextCatalog, ongoingProcess, lodash, profileService, walletService) {
  var ADDRESS_LIMIT = 5;
  var config;
  var unitName;
  var unitToSatoshi;
  var satToUnit;
  var unitDecimals;
  $scope.wallet = profileService.getWallet($stateParams.walletId);
  $scope.showInfo = false;

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    config = configService.getSync().wallet.settings;
    unitToSatoshi = config.unitToSatoshi;
    satToUnit = 1 / unitToSatoshi;
    unitName = config.unitName;
    unitDecimals = config.unitDecimals;

    // $scope.unusedAddresses = getUnusedAddreses(); No backend support TODO
    $scope.unusedAddresses = [{
      createdOn: 1479138140,
      address: "0m9sad00810m0m1d2192d9u12d9",
      path: 'xpub/0/1'
    }];

    ongoingProcess.set('extractingWalletInfo', true);
    walletService.getBalance($scope.wallet, {}, function(err, resp) {
      ongoingProcess.set('extractingWalletInfo', false);
      if (err) {
        return popupService.showAlert(gettextCatalog.getString('Error'), err);
      }

      $scope.addresses = lodash.slice(resp.byAddress, 0, ADDRESS_LIMIT);
      lodash.each($scope.addresses, function(a) {
        a.balanceStr = (a.amount * satToUnit).toFixed(unitDecimals) + ' ' + unitName;
      });
      $scope.$digest();
    });
  });

  $scope.showInformation = function() {
    $timeout(function() {
      $scope.showInfo = !$scope.showInfo;
      $ionicScrollDelegate.resize();
    });
  };
});
