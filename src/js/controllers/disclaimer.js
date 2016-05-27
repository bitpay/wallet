'use strict';

angular.module('copayApp.controllers').controller('disclaimerController',
<<<<<<< e68d1d87ec5d6c817929721a32f43cefc88aa290
  function($scope, $timeout, $log, profileService, applicationService, gettextCatalog, uxLanguage, go) {
=======
  function($scope, $timeout, $log, $ionicSideMenuDelegate, profileService, isCordova, applicationService, gettextCatalog, uxLanguage, go) {

>>>>>>> do not allow drag side bar in disclaimer screen
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

      $ionicSideMenuDelegate.canDragContent(false);
      self.lang = uxLanguage.currentLanguage;

      profileService.getProfile(function(err, profile) {
        if (!profile) {
          create(false);
        } else {
          $log.debug('There is a profile already');
          $scope.creatingProfile = false;
          profileService.bindProfile(profile, function(err) {
            if (!err || !err.message || !err.message.match('NONAGREEDDISCLAIMER')) {
              $log.debug('Disclaimer already accepted at #disclaimer. Redirect to Wallet Home.');
              $ionicSideMenuDelegate.canDragContent(true);
              go.walletHome();
            }
          });
        }
      });
    };

    this.accept = function() {
      profileService.setDisclaimerAccepted(function(err) {
        if (err) $log.error(err);
        else {
          $ionicSideMenuDelegate.canDragContent(true);
          go.walletHome();
        }
      });
    };
  });
