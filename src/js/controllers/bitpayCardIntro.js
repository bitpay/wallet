'use strict';
angular.module('copayApp.controllers').controller('bitpayCardIntroController', function($scope, $state, $timeout, $ionicHistory, storageService, externalLinkService, bitpayCardService, gettextCatalog, popupService) {

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    $scope.data = {
      index: 0
    };

    $scope.options = {
      loop: false,
      effect: 'flip',
      speed: 500,
      spaceBetween: 100
    };

    if (data.stateParams && data.stateParams.secret) {
      var obj = {
        secret: data.stateParams.secret,
        email: data.stateParams.email,
        otp: data.stateParams.otp
      };
      bitpayCardService.bitAuthPair(obj, function(err, data) {
        if (err) {
          popupService.showAlert(null, err);
          return;
        }
        var title = gettextCatalog.getString('Add BitPay Cards?');
        var msg = gettextCatalog.getString('Would you like to add this account to your wallet?');
        var ok = gettextCatalog.getString('Add cards');
        var cancel = gettextCatalog.getString('Go back');
        popupService.showConfirm(title, msg, ok, cancel, function(res) {
          if (res) {
            // Save data
            bitpayCardService.setBitpayDebitCards(data, function(err) {
              if (err) return;
              $ionicHistory.nextViewOptions({
                disableAnimate: true
              });
              $state.go('tabs.home');
            });
          }
        });
      });
    } else {
      // TODO
    }

    /*
    storageService.getNextStep('BitpayCard', function(err, value) {
      if (value)  {
        $ionicHistory.nextViewOptions({
          disableAnimate: true
        });
        $state.go('tabs.home');
        $timeout(function() {
          $state.transitionTo('tabs.bitpayCard');
        }, 100);
      }
    });
    */
  });

  $scope.orderBitPayCard = function() {
    var url = 'https://bitpay.com/visa/';
    var target = '_system';
    externalLinkService.open(url, target);
  };

  $scope.connectBitPayCard = function() {
    var url = 'https://bitpay.com/visa/login';
    var target = '_system';
    externalLinkService.open(url, target);
  };

  $scope.goBack = function() {
    if ($scope.data.index != 0) $scope.slider.slidePrev();
    else $state.go('tabs.home');
  };

  $scope.slideNext = function() {
    if ($scope.data.index != 2) $scope.slider.slideNext();
    else $state.go('tabs.home');
  };

  $scope.$on("$ionicSlides.sliderInitialized", function(event, data) {
    $scope.slider = data.slider;
  });

  $scope.$on("$ionicSlides.slideChangeStart", function(event, data) {
    $scope.data.index = data.slider.activeIndex;
  });

  $scope.$on("$ionicSlides.slideChangeEnd", function(event, data) {});
});

