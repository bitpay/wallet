'use strict';

angular.module('copayApp.controllers').controller('disclaimerController',
  function($scope, $rootScope, $timeout, $log, $ionicSideMenuDelegate, profileService, applicationService, gettextCatalog, uxLanguage, go, storageService, gettext, platformInfo, ongoingProcess) {
    var self = this;
    self.tries = 0;
    var isCordova = platformInfo.isCordova;

    ongoingProcess.set('creatingWallet', true);

    var create = function(opts) {
      opts = opts || {};
      $log.debug('Creating profile');

      profileService.create(opts, function(err) {
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
        ongoingProcess.set('creatingWallet', false);
      });
    };

    this.init = function(opts) {
      $ionicSideMenuDelegate.canDragContent(false);
      self.lang = uxLanguage.currentLanguage;

      storageService.getProfile(function(err, profile) {
        if (!profile) {
          create(opts);
        } else {
          $log.info('There is already a profile');
          ongoingProcess.set('creatingWallet', false);
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
          $rootScope.$emit('disclaimerAccepted');
          go.walletHome();
        }
      });
    };
  });
