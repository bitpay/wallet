'use strict';

angular.module('copayApp.controllers').controller('changellyController',
  function($rootScope, $timeout, $scope, $state, $stateParams, $ionicModal, $ionicScrollDelegate, $window, gettextCatalog, lodash, popupService,
    ongoingProcess, externalLinkService, latestReleaseService, profileService, walletService, configService, $log, platformInfo, storageService,
    txpModalService, appConfigService, startupService, addressbookService, feedbackService, bwcError, nextStepsService, buyAndSellService,
    homeIntegrationsService, bitpayCardService, pushNotificationsService, timeService) {
    var wallet;
    var listeners = [];
    var notifications = [];
    $scope.externalServices = {};
    $scope.openTxpModal = txpModalService.open;
    $scope.version = $window.version;
    $scope.name = appConfigService.nameCase;
    $scope.homeTip = $stateParams.fromOnboarding;
    $scope.isCordova = platformInfo.isCordova;
    $scope.isAndroid = platformInfo.isAndroid;
    $scope.isWindowsPhoneApp = platformInfo.isCordova && platformInfo.isWP;
    $scope.isNW = platformInfo.isNW;
    $scope.showRateCard = {};

    $scope.$on("$ionicView.afterEnter", function() {
      startupService.ready();
    });

    $scope.$on("$ionicView.beforeEnter", function(event, data) {

      $scope.wallets = profileService.getWallets();
      $scope.singleWallet = $scope.wallets.length == 1;

      if (!$scope.wallets[0]) return;

      // select first wallet if no wallet selected previously
      var selectedWallet = checkSelectedWallet($scope.wallet, $scope.wallets);
      $scope.onWalletSelect(selectedWallet);
    });

    $scope.$on("$ionicView.enter", function(event, data) {
      updateAllWallets();
    });

    $scope.$on("$ionicView.leave", function(event, data) {
      lodash.each(listeners, function(x) {
        x();
      });
    });

    var updateAllWallets = function() {
      $scope.wallets = profileService.getWallets();
      if (lodash.isEmpty($scope.wallets)) return;

      var i = $scope.wallets.length;
      var j = 0;
      var timeSpan = 60 * 60 * 24 * 7;

      lodash.each($scope.wallets, function(wallet) {
        walletService.getStatus(wallet, {}, function(err, status) {
          if (err) {

            wallet.error = (err === 'WALLET_NOT_REGISTERED') ? gettextCatalog.getString('Wallet not registered') : bwcError.msg(err);

            $log.error(err);
          } else {
            wallet.error = null;
            wallet.status = status;

            // TODO service refactor? not in profile service
            profileService.setLastKnownBalance(wallet.id, wallet.status.totalBalanceStr, function() {});
          }
          if (++j == i) {
            updateTxps();
          }
        });
      });
    };

    var updateTxps = function() {
      profileService.getTxps({
        limit: 3
      }, function(err, txps, n) {
        if (err) $log.error(err);
        $scope.txps = txps;
        $scope.txpsN = n;
        $timeout(function() {
          $ionicScrollDelegate.resize();
          $scope.$apply();
        }, 10);
      })
    };

    var updateWallet = function(wallet) {
      $log.debug('Updating wallet:' + wallet.name)
      walletService.getStatus(wallet, {}, function(err, status) {
        if (err) {
          $log.error(err);
          return;
        }
        wallet.status = status;
        updateTxps();
      });
    };

    $scope.setAddress = function(newAddr) {
      $scope.addr = null;
      if (!$scope.wallet || $scope.generatingAddress || !$scope.wallet.isComplete()) return;
      $scope.generatingAddress = true;
      walletService.getAddress($scope.wallet, newAddr, function(err, addr) {
        $scope.generatingAddress = false;

        if (err) {
          //Error is already formated
          popupService.showAlert(err);
        }

        $scope.addr = addr;
        $timeout(function() {
          $scope.$apply();
        }, 10);
      });
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

    var checkSelectedWallet = function(wallet, wallets) {
      if (!wallet) return wallets[0];
      var w = lodash.find(wallets, function(w) {
        return w.id == wallet.id;
      });
      if (!w) return wallets[0];
      return wallet;
    }

    $scope.onWalletSelect = function(wallet) {
      $scope.wallet = wallet;
      $scope.setAddress();
    };
  });
