'use strict';

angular.module('copayApp.controllers').controller('CopayersController',
  function($scope, $rootScope, $location, backupService, controllerUtils) {
    $scope.isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
    $scope.hideAdv = true;

    $scope.skipBackup = function() {
      var w = $rootScope.wallet;
      w.setBackupReady(true);
    };

    $scope.backup = function() {
      var w = $rootScope.wallet;
      if ($scope.isSafari) {
        $scope.viewBackup(w);
      } else {
        w.setBackupReady();
        $scope.downloadBackup(w);
      }
    };

    $scope.downloadBackup = function(w) {
      backupService.walletDownload(w);
    };
    
    $scope.viewBackup = function(w) {
      $scope.backupPlainText = backupService.walletEncrypted(w);
      $scope.hideViewBackup = true;
    };

    $scope.goToWallet = function() {
      controllerUtils.updateAddressList();
      $location.path('/receive');
    };

    $scope.copayersList = function() {
      if ($rootScope.wallet) {
        $scope.copayers = $rootScope.wallet.getRegisteredPeerIds();
      }
      return $scope.copayers;
    }

    $scope.isBackupReady = function(copayer) {
      if ($rootScope.wallet) {
        return $rootScope.wallet.publicKeyRing.isBackupReady(copayer.copayerId);
      }
    }

    $scope.deleteWallet = function() {
      controllerUtils.deleteWallet($scope);
    }

  });
