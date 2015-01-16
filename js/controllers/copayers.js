'use strict';

angular.module('copayApp.controllers').controller('CopayersController',
  function($scope, $rootScope, $timeout, go, identityService, notification) {
    var w = $rootScope.wallet;
    $scope.init = function() {
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

    $scope.deleteWallet = function() {
      $scope.loading = true;
      identityService.deleteWallet(w, function(err) {
        if (err) {
          $scope.loading = null;
          $scope.error = err.message || err;
          copay.logger.warn(err);
          $timeout(function () { $scope.$digest(); });
        } else {
          $scope.loading = false;
          if ($rootScope.wallet) {
            go.walletHome();
          }
          $timeout(function() {
            notification.success('Success', 'The wallet "' + (w.name || w.id) + '" was deleted');
          });
        }
      });
    };

  });
