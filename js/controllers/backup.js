'use strict';

angular.module('copayApp.controllers').controller('BackupController',
  function($scope, $rootScope, $location, $window, $timeout, $modal, backupService, walletFactory, controllerUtils) {
    
    $scope.backup = function() {
      var w = $rootScope.wallet;
      w.setBackupReady();
      backupService.download(w);
    };

    $scope.downloadBackup = function() {
      var w = $rootScope.wallet;
      backupService.download(w);
    }

    $scope.deleteWallet = function() {
      var w = $rootScope.wallet;
      w.disconnect();
      walletFactory.delete(w.id, function() {
        controllerUtils.logout();
      });
    };

  });
