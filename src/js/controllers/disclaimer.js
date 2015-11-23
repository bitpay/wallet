'use strict';

angular.module('copayApp.controllers').controller('disclaimerController',
  function($scope, $timeout, $log, profileService, isCordova, storageService, gettextCatalog, uxLanguage, go) {
    self = this;
    $scope.lang = uxLanguage.currentLanguage;

    $scope.goHome = function() {
      storageService.setCopayDisclaimerFlag(function(err) {
        go.walletHome();
      });
    };

    var create = function() {
      $scope.creatingProfile = true;
      profileService.create({}, function(err) {

        if (err) {

          if (err == 'EEXISTS') {
            storageService.getCopayDisclaimerFlag(function(err, val) {
              if (val) return go.walletHome();
              $scope.creatingProfile = false;
            });
          } else {
            $log.warn(err);
            $scope.error = err;
            $scope.$apply();
            $timeout(function() {
              $log.warn('Retrying to create profile......');
              create();
            }, 3000);
          }
        } else {
          $scope.error = "";
          $scope.creatingProfile = false;
        }
      });
    };

    create();

  });
