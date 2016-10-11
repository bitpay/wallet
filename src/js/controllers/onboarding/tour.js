'use strict';
angular.module('copayApp.controllers').controller('tourController',
  function($scope, $state, $log, $timeout, $filter, ongoingProcess, platformInfo, profileService, rateService, popupService, gettextCatalog) {

    var isCordova = platformInfo.isCordova;
    var isWP = platformInfo.isWP;
    var usePushNotifications = isCordova && !isWP;

    $scope.data = {
      index: 0
    };

    $scope.options = {
      loop: false,
      effect: 'flip',
      speed: 500,
      spaceBetween: 100
    }

    $scope.$on("$ionicSlides.sliderInitialized", function(event, data) {
      $scope.slider = data.slider;
    });

    $scope.$on("$ionicSlides.slideChangeStart", function(event, data) {
      $scope.data.index = data.slider.activeIndex;
    });

    $scope.$on("$ionicSlides.slideChangeEnd", function(event, data) {});

    $scope.$on("$ionicView.enter", function(event, data) {
      rateService.whenAvailable(function() {
        var localCurrency = 'USD';
        var btcAmount = 1;
        var rate = rateService.toFiat(btcAmount * 1e8, localCurrency);
        $scope.localCurrencySymbol = '$';
        $scope.localCurrencyPerBtc = $filter('formatFiatAmount')(parseFloat(rate.toFixed(2), 10));
      });
    });

    var retryCount = 0;
    $scope.createDefaultWallet = function() {
      ongoingProcess.set('creatingWallet', true);
      profileService.createDefaultWallet(function(err, walletClient) {
        if (err) {
          $log.warn(err);

          return $timeout(function() {
            $log.warn('Retrying to create default wallet.....:' + ++retryCount);
            if (retryCount > 3) {
              ongoingProcess.set('creatingWallet', false);
              popupService.showAlert(
                gettextCatalog.getString('Cannot Create Wallet'), err,
                 function() {
                  retryCount = 0;
                  return $scope.createDefaultWallet();
                }, gettextCatalog.getString('Retry'));
            } else {
              return $scope.createDefaultWallet();
            }
          }, 2000);
        };
        var wallet = walletClient;
        var walletId = wallet.credentials.walletId;
        if (!usePushNotifications) {
          $state.go('onboarding.backupRequest', {
            walletId: walletId
          });
        } else {
          $state.go('onboarding.notifications', {
            walletId: walletId
          });
        }
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
  });
