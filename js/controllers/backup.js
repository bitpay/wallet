'use strict';

angular.module('copayApp.controllers').controller('BackupController',
  function($scope, $rootScope, $location, backupService, walletFactory, controllerUtils) {
    var s = ($location.search()).advanced;
    if (s) {
      var w = $rootScope.wallet;
      $scope.priv =  w.privateKey.toObj().extendedPrivateKeyString;
    }

   
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
