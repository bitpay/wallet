'use strict';

angular.module('copayApp.controllers').controller('tabReceiveController', function($scope, $timeout, $log, platformInfo, walletService, profileService, configService, lodash, gettextCatalog, popupService) {

  $scope.isCordova = platformInfo.isCordova;

  $scope.init = function() {
    $scope.wallets = profileService.getWallets({
      onlyComplete: true
    });
    $scope.isCordova = platformInfo.isCordova;
    $scope.isNW = platformInfo.isNW;
  }

  $scope.$on('Wallet/Changed', function(event, wallet) {
    if (!wallet) {
      $log.debug('No wallet provided');
      return;
    }
    $scope.wallet = wallet;
    $log.debug('Wallet changed: ' + wallet.name);
    $scope.setAddress(wallet);
  });

  $scope.shareAddress = function(addr) {
    if ($scope.generatingAddress) return;
    if ($scope.isCordova) {
      window.plugins.socialsharing.share('bitcoin:' + addr, null, null, null);
    }
  };

  $scope.setAddress = function(wallet, forceNew) {
    if ($scope.generatingAddress) return;

    var wallet = wallet || $scope.wallet;
    $scope.addr = null;
    $scope.generatingAddress = true;

    $timeout(function() {
      walletService.getAddress(wallet, forceNew, function(err, addr) {
        $scope.generatingAddress = false;
        if (err) {
          popupService.showAlert(gettextCatalog.getString('Error'), err);
        } else {
          if (addr)
            $scope.addr = addr;
        }

        $scope.$apply();
      });
    }, 1);
  };
});
