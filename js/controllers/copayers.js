'use strict';

angular.module('copayApp.controllers').controller('CopayersController',
  function($scope, $rootScope, $location, backupService, identity, controllerUtils) {

    $scope.hideAdv = true;


    $scope.skipBackup = function() {
      var w = $rootScope.wallet;
      w.setBackupReady(true);
    };

    $scope.backup = function() {
      var w = $rootScope.wallet;
      w.setBackupReady();
      backupService.download(w);
    };

    $scope.downloadBackup = function() {
      var w = $rootScope.wallet;
      backupService.download(w);
    }

    $scope.goToWallet = function() {
      controllerUtils.updateAddressList();
      $location.path('/receive');
    };

    $scope.deleteWallet = function() {
      var w = $rootScope.wallet;
      identity.delete(w.id, function() {
        controllerUtils.logout();
      });
    };

    $scope.copayersList = function() {
      $scope.copayers = $rootScope.wallet.getRegisteredPeerIds();
      return $scope.copayers;
    }

    $scope.isBackupReady = function(copayer) {
      return $rootScope.wallet.publicKeyRing.isBackupReady(copayer.copayerId);
    }

  });
