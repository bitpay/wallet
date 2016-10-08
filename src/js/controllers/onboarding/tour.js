'use strict';
angular.module('copayApp.controllers').controller('tourController',
  function($scope, $state, $log, $timeout, $filter, ongoingProcess, profileService, rateService) {

    var tries = 0;

    $scope.init = function() {
      $scope.data = {
        index: 0
      };

      $scope.options = {
        loop: false,
        effect: 'flip',
        speed: 500,
        spaceBetween: 100
      }
    };

    rateService.whenAvailable(function() {
      var localCurrency = 'USD';
      var btcAmount = 1;
      var rate = rateService.toFiat(btcAmount * 1e8, localCurrency);
      $scope.localCurrencySymbol = '$';
      $scope.localCurrencyPerBtc = $filter('formatFiatAmount')(parseFloat(rate.toFixed(2), 10));
    });

    $scope.createDefaultWallet = function() {
      ongoingProcess.set('creatingWallet', true);
      profileService.createDefaultWallet(function(err, walletClient) {
        if (err) {
          $log.warn(err);

          return $timeout(function() {
            $log.warn('Retrying to create default wallet......');
            if (tries == 3) {
              tries == 0;
              return $scope.createDefaultWallet();
            } else {
              tries += 1;
              return $scope.createDefaultWallet();
            }
          }, 3000);
        };
        ongoingProcess.set('creatingWallet', false);
        var wallet = walletClient;
        // $state.go('onboarding.collectEmail', {
        //   fromOnboarding: true,
        //   walletId: wallet.credentials.walletId
        // });
        $state.go('tabs.home');
      });
    };

    $scope.goBack = function() {
      if ($scope.data.index != 0) $scope.slider.slidePrev();
      else $state.go('onboarding.welcome');
    }

    $scope.slideNext = function() {
      if ($scope.data.index != 2) $scope.slider.slideNext();
      else $state.go('onboarding.welcome');
    }

    $scope.$on("$ionicSlides.sliderInitialized", function(event, data) {
      $scope.slider = data.slider;
    });

    $scope.$on("$ionicSlides.slideChangeStart", function(event, data) {
      $scope.data.index = data.slider.activeIndex;
    });

    $scope.$on("$ionicSlides.slideChangeEnd", function(event, data) {});
  });
