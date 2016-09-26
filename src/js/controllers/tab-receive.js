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

    walletService.getAddress($scope.wallet, forceNew, function(err, addr) {
      $scope.generatingAddress = false;
      if (err) popupService.showAlert(gettextCatalog.getString('Error'), err);
      $scope.addr = addr;
    });
  };

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    if (!$scope.isCordova) $scope.checkTips();
    $scope.wallets = profileService.getWallets();
    $scope.$on('Wallet/Changed', function(event, wallet) {
      if (!wallet) {
        $log.debug('No wallet provided');
        return;
      }
      $timeout(function() {
        $scope.wallet = wallet;
        $log.debug('Wallet changed: ' + wallet.name);
        $scope.setAddress();
        if ($scope.wallet.showBackupNeededModal) $scope.openBackupNeededModal();
        $scope.$apply();
      });
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

  $scope.openBackupNeededModal = function() {
    $ionicModal.fromTemplateUrl('views/includes/backupNeededPopup.html', {
      scope: $scope,
      backdropClickToClose: false,
      hardwareBackButtonClose: false
    }).then(function(modal) {
      $scope.BackupNeededModal = modal;
      $scope.BackupNeededModal.show();
    });
  };

  $scope.close = function() {
    $scope.BackupNeededModal.hide();
    $scope.BackupNeededModal.remove();
    profileService.setBackupNeededModalFlag($scope.wallet.credentials.walletId);
  };

  $scope.doBackup = function() {
    $scope.close();
    $scope.goToBackupFlow();
  };

  $scope.goToBackupFlow = function() {
    $state.go('tabs.receive.backupWarning', {
      from: 'tabs.receive',
      walletId: $scope.wallet.credentials.walletId
    });
  }
});
