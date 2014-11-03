'use strict';

angular.module('copayApp.controllers').controller('CopayersController',
  function($scope, $rootScope, $location, controllerUtils) {
    if (!$rootScope.wallet.isReady()) {
      $rootScope.title = 'Waiting copayers for ' + $rootScope.wallet.getName();
    }
    $scope.loading = false;

    $scope.goToWallet = function() {
      controllerUtils.updateAddressList();
      $location.path('/homeWallet');

    };

    $scope.copayersList = function() {
      if ($rootScope.wallet) {
        $scope.copayers = $rootScope.wallet.getRegisteredPeerIds();
      }
      return $scope.copayers;
    }
  });
