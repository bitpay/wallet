'use strict';
angular.module('copayApp.controllers').controller('tourController',
  function($scope, $state, $log, $timeout, ongoingProcess, profileService) {

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

    $scope.createProfile = function(opts) {
      var tries = 0;
      opts = opts || {};
      $log.debug('Creating profile');
      ongoingProcess.set('creatingWallet', true);
      profileService.create(opts, function(err) {
        if (err) {
          $log.warn(err);
          $scope.error = err;
          $scope.$apply();

          return $timeout(function() {
            $log.warn('Retrying to create profile......');
            if (tries == 3) {
              tries == 0;
              return $scope.createProfile({
                noWallet: true
              });
            } else {
              tries += 1;
              return $scope.createProfile();
            }
          }, 3000);
        };
        $scope.error = "";
        ongoingProcess.set('creatingWallet', false);
        var wallet = profileService.getWallets()[0];
        $state.go('onboarding.collectEmail', {
          walletId: wallet.credentials.walletId
        });
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
