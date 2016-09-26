'use strict';

angular.module('copayApp.controllers').controller('tabReceiveController', function($scope, $timeout, $log, $ionicModal, $state, $ionicHistory, storageService, platformInfo, walletService, profileService, configService, lodash, gettextCatalog, popupService) {

  $scope.isCordova = platformInfo.isCordova;
  $scope.isNW = platformInfo.isNW;

  $scope.checkTips = function(force) {
    storageService.getReceiveTipsAccepted(function(err, accepted) {
      if (err) $log.warn(err);
      if (accepted && !force) return;

      $timeout(function() {
        $ionicModal.fromTemplateUrl('views/modals/receive-tips.html', {
          scope: $scope
        }).then(function(modal) {
          $scope.receiveTipsModal = modal;
          $scope.receiveTipsModal.show();
        });
      }, force ? 1 : 1000);
    });
  };

  $scope.shareAddress = function(addr) {
    if ($scope.generatingAddress) return;
    if ($scope.isCordova) {
      window.plugins.socialsharing.share('bitcoin:' + addr, null, null, null);
    }
  };

  $scope.setAddress = function(forceNew) {
    if ($scope.generatingAddress || !$scope.wallet.isComplete()) return;

    $scope.addr = null;
    $scope.generatingAddress = true;

    $timeout(function() {
      walletService.getAddress($scope.wallet, forceNew, function(err, addr) {
        $scope.generatingAddress = false;
        if (err) popupService.showAlert(gettextCatalog.getString('Error'), err);
        $scope.addr = addr;
        $scope.$apply();
      });
    }, 1);
  };

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    if (!$scope.isCordova) $scope.checkTips();
    $scope.wallets = profileService.getWallets();
    $scope.$on('Wallet/Changed', function(event, wallet) {
      if (!wallet) {
        $log.debug('No wallet provided');
        return;
      }
      $scope.wallet = wallet;
      $log.debug('Wallet changed: ' + wallet.name);
      $scope.setAddress();
    });
  });

  $scope.goCopayers = function() {
    $ionicHistory.removeBackView();
    $ionicHistory.nextViewOptions({
      disableAnimate: true
    });
    $state.go('tabs.home');
    $timeout(function() {
      $state.transitionTo('tabs.copayers', {
        walletId: $scope.wallet.credentials.walletId
      });
    }, 100);
  };

  $scope.openBackupNeededPopup = function() {
    $ionicModal.fromTemplateUrl('views/includes/backupNeededPopup.html', {
      scope: $scope,
      backdropClickToClose: false,
      hardwareBackButtonClose: false
    }).then(function(modal) {
      $scope.BackupNeededPopup = modal;
      $scope.BackupNeededPopup.show();
    });
  };

  $scope.closeBackupNeededModal = function() {
    $scope.BackupNeededPopup.hide();
    $scope.BackupNeededPopup.remove();
  };

  $scope.goToBackupFlow = function() {
    $scope.BackupNeededPopup.hide();
    $scope.BackupNeededPopup.remove();
    $state.go('tabs.receive.backup', {
      fromReceive: true,
      walletId: $scope.wallet.credentials.walletId
    });
  };
});
