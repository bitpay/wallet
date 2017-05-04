'use strict';

angular.module('copayApp.controllers').controller('tabReceiveController', function($rootScope, $scope, $timeout, $log, $ionicModal, $state, $ionicHistory, $ionicPopover, storageService, platformInfo, walletService, profileService, configService, lodash, gettextCatalog, popupService, bwcError) {

  var listeners = [];
  $scope.isCordova = platformInfo.isCordova;
  $scope.isNW = platformInfo.isNW;

  $scope.requestSpecificAmount = function() {
    $state.go('tabs.receive.amount', {
      customAmount: true,
      toAddress: $scope.addr
    });
  };

  $scope.setAddress = function() {
    if (!$scope.wallet || $scope.generatingAddress || !$scope.wallet.isComplete()) return;
    $scope.addr = null;
    $scope.generatingAddress = true;
    walletService.getAddress($scope.wallet, false, function(err, addr) {
      $scope.generatingAddress = false;

      if (err) {
        //Error is already formated
        return popupService.showAlert(err);
      }

      $scope.addr = addr;
      $timeout(function() {
        $scope.$apply();
      }, 10);
    });
  };

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

  $scope.updateCurrentWallet = function(wallet) {
    walletService.getStatus(wallet, {}, function(err, status) {
      if (err) {
        return popupService.showAlert(bwcError.msg(err, gettextCatalog.getString('Could not update wallet')));
      }
      $timeout(function() {
        $scope.wallet = profileService.getWallet(wallet.id);
        $scope.wallet.status = status;
        $scope.setAddress();
        $scope.$apply();
      }, 200);
    });
  };

  $scope.shouldShowReceiveAddressFromHardware = function() {
    var wallet = $scope.wallet;
    if (wallet.isPrivKeyExternal() && wallet.credentials.hwInfo) {
      return (wallet.credentials.hwInfo.name == walletService.externalSource.intelTEE.id);
    } else {
      return false;
    }
  };

  $scope.showReceiveAddressFromHardware = function() {
    var wallet = $scope.wallet;
    if (wallet.isPrivKeyExternal() && wallet.credentials.hwInfo) {
      walletService.showReceiveAddressFromHardware(wallet, $scope.addr, function() {});
    }
  };

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    $scope.wallets = profileService.getWallets();
    $scope.singleWallet = $scope.wallets.length == 1;

    listeners = [
      $rootScope.$on('bwsEvent', function(e, walletId, type, n) {
        // Update current address
        if ($scope.wallet && walletId == $scope.wallet.id) $scope.updateCurrentWallet($scope.wallet);
      })
      ];

    if (!$scope.wallets[0]) return;
    if (!$scope.wallet) return $scope.init();

    var w = lodash.find($scope.wallets, function(w) {
      return w.id == $scope.wallet.id;
    });
    if (w) $scope.updateCurrentWallet($scope.wallet);
    else $scope.init();
  });

  $scope.init = function() {
    $scope.wallet = $scope.wallets[0];
    $scope.updateCurrentWallet($scope.wallet);
  };

  $scope.$on("$ionicView.leave", function(event, data) {
    lodash.each(listeners, function(x) {
      x();
    });
  });

  $scope.onWalletSelect = function(wallet) {
    $scope.updateCurrentWallet(wallet);
  };

  $scope.showWalletSelector = function() {
    if ($scope.singleWallet) return;
    $scope.walletSelectorTitle = gettextCatalog.getString('Address from');
    $scope.showWallets = true;
  };

  $scope.copyToClipboard = function() {
    if ($scope.isCordova) return 'bitcoin:' + $scope.addr;
    else return $scope.addr;
  }
});
