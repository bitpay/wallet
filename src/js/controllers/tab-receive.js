'use strict';

angular.module('copayApp.controllers').controller('tabReceiveController', function($scope, $ionicPopover, $timeout, $log, platformInfo, nodeWebkit, walletService, profileService, configService, lodash, gettextCatalog) {

  $scope.isCordova = platformInfo.isCordova;

  $scope.init = function() {
    $scope.defaultWallet = profileService.getWallets()[0];
    $scope.isCordova = platformInfo.isCordova;
    $scope.isNW = platformInfo.isNW;
    $scope.setAddress(false);
  }

  $scope.copyToClipboard = function(addr, $event) {
    var showPopover = function() {
      $ionicPopover.fromTemplateUrl('views/includes/copyToClipboard.html', {
        scope: $scope
      }).then(function(popover) {
        $scope.popover = popover;
        $scope.popover.show($event);
      });

      $scope.close = function() {
        $scope.popover.hide();
      }

      $timeout(function() {
        $scope.popover.hide(); //close the popover after 0.7 seconds
      }, 700);

      $scope.$on('$destroy', function() {
        $scope.popover.remove();
      });
    };

    if ($scope.isCordova) {
      window.cordova.plugins.clipboard.copy(addr);
      window.plugins.toast.showShortCenter(gettextCatalog.getString('Copied to clipboard'));
    } else if ($scope.isNW) {
      nodeWebkit.writeToClipboard(addr);
      showPopover($event);
    }
  };

  $scope.$on('Wallet/Changed', function(event, wallet) {
    if (!wallet) {
      $log.debug('No wallet provided');
      return;
    }
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
    $scope.addrError = null;

    if (wallet && !wallet.isComplete()) {
      $scope.incomplete = true;
      $timeout(function() {
        $scope.$digest();
      });
      return;
    }

    $scope.incomplete = false;
    $scope.generatingAddress = true;

    $timeout(function() {
      walletService.getAddress(wallet, forceNew, function(err, addr) {
        $scope.generatingAddress = false;
        if (err) {
          $scope.addrError = err;
        } else {
          if (addr)
            $scope.addr = addr;
        }
        $scope.$digest();
      });
    });
  };
});
