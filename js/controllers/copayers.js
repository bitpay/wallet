'use strict';

angular.module('copayApp.controllers').controller('CopayersController',
  function($scope, $rootScope, $location, backupService, walletFactory, controllerUtils) {

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
      $location.path('/receive');
    };

    $scope.deleteWallet = function() {
      var w = $rootScope.wallet;
      w.disconnect();
      walletFactory.delete(w.id, function() {
        controllerUtils.logout();
      });
    };
  });
