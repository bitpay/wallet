'use strict';

angular.module('copayApp.controllers').controller('addressesController', function($scope, $stateParams, $timeout, $ionicScrollDelegate, ongoingProcess, lodash, profileService, walletService) {
  var ADDRESS_LIMIT = 5;
  $scope.wallet = profileService.getWallet($stateParams.walletId);
  $scope.showInfo = false;

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    // $scope.unusedAddresses = getUnusedAddreses(); No backend support TODO
    $scope.unusedAddresses = [{
      createdOn: 1479138140,
      address: "0m9sad00810m0m1d2192d9u12d9",
      path: 'xpub/0/1'
    }];

    ongoingProcess.set('extractingWalletInfo', true);
    walletService.getMainAddresses($scope.wallet, ADDRESS_LIMIT, function(err, addresses) {
      ongoingProcess.set('extractingWalletInfo', false);
      $scope.addresses = lodash.map(addresses, function(addr) {
        return {
          createdOn: addr.createdOn,
          address: addr.address,
          path: addr.path.replace(/^m/g, 'xpub')
        };
      });

      console.log($scope.addresses);
    });
  });

  $scope.showInformation = function() {
    $timeout(function() {
      $scope.showInfo = !$scope.showInfo;
      $ionicScrollDelegate.resize();
    });
  };
});
