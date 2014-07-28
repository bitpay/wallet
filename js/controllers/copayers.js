'use strict';

angular.module('copayApp.controllers').controller('CopayersController',
  function($scope, $rootScope, $location, backupService) {

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
      $location.path('/addresses');
    };

  });
