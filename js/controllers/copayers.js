'use strict';

angular.module('copayApp.controllers').controller('CopayersController',
  function($scope, $rootScope, $location) {

    if (!$rootScope.wallet.isComplete()) {
      $rootScope.title = 'Waiting copayers for ' + $rootScope.wallet.getName();
    }
    $scope.loading = false;
    $scope.secret = $rootScope.wallet.getSecret();

    $scope.goToWallet = function() {
      $location.path('/homeWallet');
    };

    $scope.copayersList = function() {
      if ($rootScope.wallet) {
        $scope.copayers = $rootScope.wallet.getRegisteredPeerIds();
      }
      return $scope.copayers;
    }
  });
