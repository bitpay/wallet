'use strict';

angular.module('copayApp.controllers').controller('BackupController',
  function($scope, $rootScope, backupService, walletFactory, controllerUtils) {
    $scope.download = function() {
      backupService.download($rootScope.wallet);
    };

    $scope.deleteWallet = function() {
      var w = $rootScope.wallet;
      w.disconnect();
      walletFactory.delete(w.id, function() {
        controllerUtils.logout();
      });
    };

  });
