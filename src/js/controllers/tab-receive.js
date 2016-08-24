'use strict';

angular.module('copayApp.controllers').controller('tabReceiveController', function($scope, $timeout, $log, platformInfo, walletService, profileService, configService, lodash, gettextCatalog) {

  $scope.isCordova = platformInfo.isCordova;

  $scope.init = function() {
    $scope.defaultWallet = profileService.getWallets()[0];
    $scope.isCordova = platformInfo.isCordova;
    $scope.isNW = platformInfo.isNW;
    $scope.setAddress(false);
  }

  $scope.$on('Wallet/Changed', function(event, wallet) {
    if (!wallet) {
      $log.debug('No wallet provided');
      return;
    }
    $scope.defaultWallet = wallet;
    $log.debug('Wallet changed: ' + wallet.name);
    $scope.setAddress(wallet);
  });

  $scope.shareAddress = function(addr) {
    if ($scope.isCordova) {
      window.plugins.socialsharing.share('bitcoin:' + addr, null, null, null);
    }
  };

  $scope.setAddress = function(wallet, forceNew) {
    var wallet = wallet || $scope.defaultWallet;
    if ($scope.generatingAddress) return;

    $scope.addr = null;
    $scope.error = null;

    if (wallet && !wallet.isComplete()) {
      $timeout(function() {
        $scope.$digest();
      });
      return;
    }

    $scope.generatingAddress = true;

    $timeout(function() {
      walletService.getAddress(wallet, forceNew, function(err, addr) {
        $scope.generatingAddress = false;
        if (err) {
          $scope.error = err;
        } else {
          if (addr)
            $scope.addr = addr;
        }
        $scope.$digest();
      });
    });
  };
});
