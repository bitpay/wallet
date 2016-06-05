'use strict';

angular.module('copayApp.controllers').controller('disclaimerController',
  function($scope, $timeout, $log, $ionicSideMenuDelegate, profileService, applicationService, gettextCatalog, uxLanguage, go) {
    var self = this;
    self.tries = 0;
    self.creatingProfile = true;

    var create = function(opts) {
      opts = opts || {};
      $log.debug('Creating profile');
      profileService.create(opts, function(err) {

        console.log('[disclaimer.js.13]', err); //TODO
        if (err) {
          $log.warn(err);
          $scope.error = err;
          $scope.$apply();

          return $timeout(function() {
            $log.warn('Retrying to create profile......');
            if (self.tries == 3) {
              self.tries == 0;
              return create({
                noWallet: true
              });
            } else {
              self.tries += 1;
              return create();
            }
          }, 3000);
        };

        $scope.error = "";
        self.creatingProfile = false;

        console.log('[disclaimer.js.33]'); //TODO
      });
    };

    this.init = function(opts) {
      $ionicSideMenuDelegate.canDragContent(false);
      self.lang = uxLanguage.currentLanguage;

      profileService.getProfile(function(err, profile) {
        if (!profile) {

          console.log('[disclaimer.js.43]'); //TODO
          create(opts);
          console.log('[disclaimer.js.46]'); //TODO
        } else {
          $log.info('There is already a profile');
          self.creatingProfile = false;
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
