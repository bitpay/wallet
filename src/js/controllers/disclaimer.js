'use strict';

angular.module('copayApp.controllers').controller('disclaimerController',
  function($scope, $timeout, $log, profileService, isCordova, storageService, applicationService, gettextCatalog, uxLanguage, go) {
    var self = this;
    self.tries = 0;
    $scope.creatingProfile = true;

    var create = function(noWallet) {
      profileService.create({
        noWallet: noWallet
      }, function(err) {

        if (err) {
          $log.warn(err);
          $scope.error = err;
          $scope.$apply();
          $timeout(function() {
            $log.warn('Retrying to create profile......');
            if (self.tries == 3) {
              self.tries == 0;
              create(true);
            } else {
              self.tries += 1;
              create(false);
            }
          }, 3000);
        } else {
          $scope.error = "";
          $scope.creatingProfile = false;
        }
      });
    };

    this.init = function() {
      self.lang = uxLanguage.currentLanguage;
      storageService.getProfile(function(err, profile) {
        if (!profile) create(false);
        else $scope.creatingProfile = false;

        //compatible
        profileService.isDisclaimerAccepted(function(val) {
          if (val) go.walletHome();
        });
      });
    };

    this.accept = function() {
      profileService.setDisclaimerAccepted(function(err) {
        if (err) $log.error(err);
        else go.walletHome();
      });
    };
});
