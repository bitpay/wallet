'use strict';

angular.module('copayApp.controllers').controller('splashController',
  function($scope, $timeout, $log, profileService, storageService, go) {
    storageService.getCopayDisclaimerFlag(function(err, val) {
      if (!val) go.path('disclaimer');

      if (profileService.profile) {
        go.walletHome();
      }
    });

    $scope.create = function(noWallet) {
      $scope.creatingProfile = true;

      $timeout(function() {
        profileService.create({
          noWallet: noWallet
        }, function(err) {
          if (err) {
            $scope.creatingProfile = false;
            $log.warn(err);
            $scope.error = err;
            $scope.$apply();
            $timeout(function() {
              $scope.create(noWallet);
            }, 3000);
          }
        });
      }, 100);
    };
  });
