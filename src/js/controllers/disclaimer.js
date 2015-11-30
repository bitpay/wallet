'use strict';

angular.module('copayApp.controllers').controller('disclaimerController',
  function($scope, $timeout, $log, profileService, isCordova, storageService, applicationService, gettextCatalog, uxLanguage, go) {
    self = this;
    $scope.lang = uxLanguage.currentLanguage;

    $scope.goHome = function() {
      storageService.getProfile(function(err, profile) {
        profile.agreeDisclaimer = true;
        storageService.storeProfile(profile, function() {
          go.walletHome();
        });
      });
    };

    var create = function() {
      $scope.creatingProfile = true;
      profileService.create({}, function(err) {

        if (err) {
          $log.warn(err);
          if (err == 'EEXISTS') {

            if (profileService.profile.agreeDisclaimer) return go.walletHome();
            $scope.creatingProfile = false;

          } else {
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

    storageService.getProfile(function(err, profile) {
      if (!profile) create();
      else $scope.creatingProfile = false;
    });


  });
