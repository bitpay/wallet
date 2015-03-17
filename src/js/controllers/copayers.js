'use strict';

angular.module('copayApp.controllers').controller('copayersController',
  function($scope, $rootScope, $timeout, profileService, go, notification, isCordova) {
    var self = this;
    var fc = profileService.focusedClient;


    self.init = function() {
      $rootScope.title = 'Share this secret with your copayers';
      self.loading = false;
      self.isCordova = isCordova;
      // TODO
      // w.on('publicKeyRingUpdated', self.updateList);
      // w.on('ready', self.updateList);
      //
      self.updateList();
    };

    self.updateList = function() {
      return;

      // TODO
      var w = $rootScope.wallet;

      self.copayers = $rootScope.wallet.getRegisteredPeerIds();
      if (w.isComplete()) {

        w.removeListener('publicKeyRingUpdated', self.updateList);
        w.removeListener('ready', self.updateList);
        go.walletHome();
      }
      $timeout(function() {
        $rootScope.$digest();
      }, 1);
    };

    self.deleteWallet = function() {
      $rootScope.starting = true;
      $timeout(function() {
        identityService.deleteWallet(w, function(err) {
          $rootScope.starting = false;
          if (err) {
            self.error = err.message || err;
            copay.logger.warn(err);
            $timeout(function() {
              self.$digest();
            });
          } else {
            if ($rootScope.wallet) {
              go.walletHome();
            }
            $timeout(function() {
              notification.success('Success', 'The wallet "' + (w.name || w.id) + '" was deleted');
            });
          }
        });
      }, 100);
    };

    self.copySecret = function(secret) {
      if (isCordova) {
        window.cordova.plugins.clipboard.copy(secret);
        window.plugins.toast.showShortCenter('Copied to clipboard');
      }
    };

    self.shareSecret = function(secret) {
      if (isCordova) {
        if (isMobile.Android() || isMobile.Windows()) {
          window.ignoreMobilePause = true;
        }
        window.plugins.socialsharing.share(secret, null, null, null);
      }
    };

  });
