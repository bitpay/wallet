'use strict';

angular.module('copayApp.controllers').controller('BackupController',
  function($scope, $rootScope, $location, $window, $timeout, $modal, backupService, walletFactory, controllerUtils) {
    $scope.title = 'Backup';

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
