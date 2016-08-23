'use strict';

angular.module('copayApp.controllers').controller('tabReceiveController', function($scope, $ionicPopover, $timeout, $log, platformInfo, nodeWebkit, walletService, profileService, configService, lodash, gettextCatalog) {

  $scope.isCordova = platformInfo.isCordova;

  $scope.init = function() {
    $scope.index = 0;
    $scope.isCordova = platformInfo.isCordova;
    $scope.isNW = platformInfo.isNW;
    // $scope.setWallets();
    $scope.setAddress(false);
    // $scope.options = {
    //   loop: false,
    //   effect: 'flip',
    //   speed: 500,
    //   spaceBetween: 100
    // }
    //
    // $scope.$on("$ionicSlides.sliderInitialized", function(event, data) {
    //   // data.slider is the instance of Swiper
    //   $scope.slider = data.slider;
    // });
    //
    // $scope.$on("$ionicSlides.slideChangeStart", function(event, data) {
    //   console.log('Slide change is beginning');
    // });
    //
    // $scope.$on("$ionicSlides.slideChangeEnd", function(event, data) {
    //   $scope.index = data.slider.activeIndex;
    //   $scope.setAddress();
    // });
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
    console.log(wallet);
    $log.debug('Wallet changed: ' + wallet.name);
    $scope.setAddress(wallet);
  });

  $scope.shareAddress = function(addr) {
    if ($scope.isCordova) {
      window.plugins.socialsharing.share('bitcoin:' + addr, null, null, null);
    }
  };

  $scope.setAddress = function(wallet, forceNew) {
    if (!wallet) return;
    if ($scope.generatingAddress) return;

    $scope.addr = null;
    $scope.addrError = null;

    if (!wallet.isComplete()) {
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


  $scope.setWallets = function() {
    $scope.wallets = profileService.getWallets();
  };

});
