'use strict';

angular.module('copayApp.controllers').controller('tabReceiveController', function($scope, $ionicPopover, $timeout, platformInfo, nodeWebkit, addressService, profileService, configService, lodash) {

  $scope.init = function() {
    $scope.index = 0;
    $scope.isCordova = platformInfo.isCordova;
    $scope.isNW = platformInfo.isNW;
    $scope.setWallets();
    $scope.setAddress(false);
    $scope.options = {
      loop: false,
      effect: 'flip',
      speed: 500,
      spaceBetween: 100
    }

    $scope.$on("$ionicSlides.sliderInitialized", function(event, data) {
      // data.slider is the instance of Swiper
      $scope.slider = data.slider;
    });

    $scope.$on("$ionicSlides.slideChangeStart", function(event, data) {
      console.log('Slide change is beginning');
    });

    $scope.$on("$ionicSlides.slideChangeEnd", function(event, data) {
      $scope.index = data.slider.activeIndex;
      $scope.setAddress(false);
    });
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

  $scope.shareAddress = function(addr) {
    if ($scope.isCordova) {
      window.plugins.socialsharing.share('bitcoin:' + addr, null, null, null);
    }
  };

  $scope.setAddress = function(forceNew) {
    $scope.addrError = null;
    $scope.generatingAddress = true;
    $timeout(function() {
      addressService.getAddress($scope.wallets[$scope.index].id, forceNew, function(err, addr) {
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
    if (!profileService.profile) return;

    var config = configService.getSync();
    config.colorFor = config.colorFor || {};
    config.aliasFor = config.aliasFor || {};

    // Sanitize empty wallets (fixed in BWC 1.8.1, and auto fixed when wallets completes)
    var credentials = lodash.filter(profileService.profile.credentials, 'walletName');
    var ret = lodash.map(credentials, function(c) {
      return {
        m: c.m,
        n: c.n,
        name: config.aliasFor[c.walletId] || c.walletName,
        id: c.walletId,
        color: config.colorFor[c.walletId] || '#4A90E2',
      };
    });

    $scope.wallets = lodash.sortBy(ret, 'name');
  };

});
