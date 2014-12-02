'use strict';

angular.module('copayApp.controllers').controller('HomeWalletController', function($scope, $rootScope) {
  $scope.init = function() {

    $rootScope.title = 'Home';
    $scope.addr = _.last($rootScope.wallet.getReceiveAddresses());

    // This is necesarry, since wallet can change in homeWallet, without running init() again.
    $rootScope.$watch('wallet', function() {
      if ($rootScope.wallet && $rootScope.wallet.isComplete()) {
        $scope.addr = _.last($rootScope.wallet.getReceiveAddresses());
      }
    });
  };
});
