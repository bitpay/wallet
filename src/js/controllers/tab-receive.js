'use strict';

angular.module('copayApp.controllers').controller('tabReceiveController', function($scope, $timeout, $log, $ionicModal, $state, $ionicHistory, storageService, platformInfo, walletService, profileService, configService, lodash, gettextCatalog, popupService) {

  $scope.isCordova = platformInfo.isCordova;
  $scope.isNW = platformInfo.isNW;
  $scope.walletAddrs = {};

  $scope.shareAddress = function(addr) {
    if ($scope.generatingAddress) return;
    if ($scope.isCordova) {
      window.plugins.socialsharing.share('bitcoin:' + addr, null, null, null);
    }
  };

  $scope.setAddress = function(forceNew) {
    if (!$scope.wallet || $scope.generatingAddress || !$scope.wallet.isComplete()) return;
    $scope.addr = null;
    $scope.generatingAddress = true;
    walletService.getAddress($scope.wallet, forceNew, function(err, addr) {
      $scope.generatingAddress = false;
      if (err) popupService.showAlert(gettextCatalog.getString('Error'), err);
      $scope.addr = addr;
      if ($scope.walletAddrs[$scope.wallet.id]) $scope.walletAddrs[$scope.wallet.id] = addr;
      $timeout(function() {
        $scope.$apply();
      }, 10);
    });
  };

  $scope.loadAddresses = function(wallet, index) {
    walletService.getAddress(wallet, false, function(err, addr) {
      $scope.walletAddrs[wallet.id] = addr || null;
    });
  }

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
  };

  $scope.setWallet = function(index) {
    $scope.wallet = $scope.wallets[index];
    $scope.walletIndex = index;
    if ($scope.walletAddrs[$scope.walletIndex].addr) $scope.addr = $scope.walletAddrs[$scope.walletIndex].addr;
    else $scope.setAddress(false);
  }

  $scope.isActive = function(index) {
    return $scope.wallets[index] == $scope.wallet;
  }

  $scope.walletPosition = function(index) {
    if (index == $scope.walletIndex) return 'current';
    if (index < $scope.walletIndex) return 'prev';
    if (index > $scope.walletIndex) return 'next';
  }


  $scope.$on('Wallet/Changed', function(event, wallet) {
    $scope.wallet = wallet;
    $scope.walletIndex = lodash.findIndex($scope.wallets, function(wallet) {
      return wallet.id == $scope.wallet.id;
    });
    if (!$scope.walletAddrs[wallet.id]) $scope.setAddress(false);
    else $scope.addr = $scope.walletAddrs[wallet.id];
    $scope.$apply();
    if (!wallet) {
      $log.debug('No wallet provided');
      return;
    }
    if (wallet == $scope.wallet) {
      $log.debug('No change in wallet');
      return;
    }
    $scope.wallet = wallet;
    $log.debug('Wallet changed: ' + wallet.name);
  });

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    $scope.wallets = profileService.getWallets();
    lodash.each($scope.wallets, function(wallet, index) {
      $scope.loadAddresses(wallet);
    });
  });
});
