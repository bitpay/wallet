'use strict';

angular.module('copayApp.controllers').controller('BackupController',
  function($scope, $rootScope, backupService, walletFactory, controllerUtils) {
    
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
