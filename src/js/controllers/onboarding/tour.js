'use strict';
angular.module('copayApp.controllers').controller('tourController',
  function ($scope, $state, $log, $timeout, $filter, ongoingProcess, profileService, rateService, popupService, gettextCatalog) {

    $scope.data = {
      index: 0
    };

    $scope.options = {
      loop: false,
      effect: 'flip',
      speed: 500,
      spaceBetween: 100
    }

    $scope.$on("$ionicSlides.sliderInitialized", function (event, data) {
      $scope.slider = data.slider;
    });

    $scope.$on("$ionicSlides.slideChangeStart", function (event, data) {
      $scope.data.index = data.slider.activeIndex;
    });

    $scope.$on("$ionicSlides.slideChangeEnd", function (event, data) { });

    $scope.$on("$ionicView.enter", function (event, data) {
      rateService.whenAvailable(function () {
        var localCurrency = 'USD';
        var btcAmount = 1;
        var rate = rateService.toFiat(btcAmount * 1e8, localCurrency, 'btc');
        $scope.localCurrencySymbol = '$';
        $scope.localCurrencyPerBtc = $filter('formatFiatAmount')(parseFloat(rate.toFixed(2), 10));
        $timeout(function () {
          $scope.$apply();
        })
      });
    });

    var retryCount = 0;
    $scope.createDefaultWallet = function () {
      ongoingProcess.set('creatingWallet', true);
      $timeout(function () {
        profileService.createDefaultWallet(function (err, walletClient) {
          if (err) {
            $log.warn(err);

            return $timeout(function () {
              $log.warn('Retrying to create default wallet.....:' + ++retryCount);
              if (retryCount > 3) {
                ongoingProcess.set('creatingWallet', false);
                popupService.showAlert(
                  gettextCatalog.getString('Cannot Create Wallet'), err,
                  function () {
                    retryCount = 0;
                    return $scope.createDefaultWallet();
                  }, gettextCatalog.getString('Retry'));
              } else {
                return $scope.createDefaultWallet();
              }
            }, 2000);
          };
          ongoingProcess.set('creatingWallet', false);
          var wallet = walletClient;
          var walletId = wallet.credentials.walletId;

          $state.go('onboarding.collectEmail', {
            walletId: walletId
          });

          /*
        $state.go('onboarding.backupRequest', {
          walletId: walletId
        });
          */
        });
      }, 300);
    };

    $scope.goBack = function () {
      if ($scope.data.index != 0) $scope.slider.slidePrev();
      else $state.go('onboarding.welcome');
    }

    $scope.slideNext = function () {
      if ($scope.data.index != 2) $scope.slider.slideNext();
      else $state.go('onboarding.welcome');
    }
  });
