'use strict';

angular.module('copayApp.controllers').controller('tabReceiveController', function($scope, $timeout, $log, $ionicModal, storageService, platformInfo, walletService, profileService, configService, lodash, gettextCatalog, popupService) {

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
    if ($scope.generatingAddress) return;

    $scope.addr = null;
    $scope.generatingAddress = true;

    $timeout(function() {
      walletService.getAddress($scope.wallet, forceNew, function(err, addr) {
        $scope.generatingAddress = false;
        if (err || lodash.isEmpty(addr)) {
          popupService.showAlert(gettextCatalog.getString('Error'), err || gettextCatalog.getString('Address is empty'));
          return;
        }
        $scope.addr = addr;
        $scope.$apply();
      });
    }, 1);
  };

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    if (!$scope.isCordova) $scope.checkTips();
    $scope.wallets = profileService.getWallets({
      onlyComplete: true
    });
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
});
