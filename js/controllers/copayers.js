'use strict';

angular.module('copayApp.controllers').controller('CopayersController',
  function($scope, $rootScope, $location, backupService, walletFactory, controllerUtils) {
    $scope.isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
    $scope.hideAdv = true;

    $scope.sendEmail = function(backupPlainText) {
      var w = $rootScope.wallet;
      var link = 'mailto:'
        + '?subject=' + escape(backupService.getFilename(w)) 
        + '&body=' + escape(backupPlainText) + ''; 

      window.location.href = link;
    };

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
      backupService.download(w);
    };
    
    $scope.viewBackup = function(w) {
      $scope.backupPlainText = backupService.getBackup(w);
      $scope.hideViewBackup = true;
    };

    $scope.goToWallet = function() {
      controllerUtils.updateAddressList();
      $location.path('/receive');
    };

    $scope.deleteWallet = function() {
      var w = $rootScope.wallet;
      walletFactory.delete(w.id, function() {
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
