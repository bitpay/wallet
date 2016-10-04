'use strict';
angular.module('copayApp.controllers').controller('bitpayCardIntroController', function($scope, $state, $timeout, $ionicHistory, storageService, externalLinkService, bitpayCardService) {

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
  });

  $scope.orderBitPayCard = function() {
    var url = 'https://bitpay.com/visa/';
    var target = '_system';
    externalLinkService.open(url, target);
  };

  $scope.connectBitPayCard = function() {};

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

