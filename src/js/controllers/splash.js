'use strict';

angular.module('copayApp.controllers').controller('splashController',
  function($scope, $timeout, $log, profileService, storageService, go, bwcService) {
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

console.log('[splash.js.32]'); //TODO
      var a = bwcService.getClient();

console.log('[splash.js.34]'); //TODO
a.seedFromMnemonic('glare benefit approve speak post afford spot cancel argue cushion unaware kitchen');
console.log("LISTO", a.credentials);
 
  });
