'use strict';

angular.module('copayApp.controllers').controller('CopayersController',
  function($scope, $rootScope, $timeout, go) {
    $scope.init = function() {
      var w = $rootScope.wallet;
      $rootScope.title = 'Share this secret with your copayers';
      $scope.loading = false;
      $scope.secret = $rootScope.wallet.getSecret();

      w.on('publicKeyRingUpdated', $scope.updateList);
      w.on('ready', $scope.updateList);
      $scope.updateList();
    };

    $scope.updateList = function() {
      var w = $rootScope.wallet;

      $scope.copayers = $rootScope.wallet.getRegisteredPeerIds();
      if (w.isComplete()) {

        w.removeListener('publicKeyRingUpdated', $scope.updateList);
        w.removeListener('ready', $scope.updateList);
        go.walletHome();
      }
      $timeout(function() {
        $rootScope.$digest();
      }, 1);
    };
  });
