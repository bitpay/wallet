'use strict';

angular.module('copayApp.controllers').controller('disclaimerController',
  function($scope, $timeout, $log, profileService, isCordova, storageService, gettextCatalog, applicationService, uxLanguage, go) {
    self = this;
    $scope.noProfile = true;

    $scope.create = function() {
      storageService.setCopayDisclaimerFlag(function(err) {
        applicationService.restart();
      });
    };

    $scope.init = function(noWallet) {
      storageService.getCopayDisclaimerFlag(function(err, val) {
        $scope.lang = uxLanguage.currentLanguage;
        $scope.agreed = val;

        profileService.create({
          noWallet: noWallet
        }, function(err) {
          if (err && !'EEXIST') {
            $log.warn(err);
            $scope.error = err;
            $scope.$apply();
            $scope.noProfile = true;
            $timeout(function() {
              $scope.init();
            }, 3000);
          } else {
            $scope.error = "";
            $scope.noProfile = false;
          }
        });
      });
    };

  });
