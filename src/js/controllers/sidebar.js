'use strict';

angular.module('copayApp.controllers').controller('sidebarController',
  function($rootScope, $timeout, lodash, profileService, isMobile, isCordova, go) {
    var self = this;

    self.isMobile = isMobile.any();
    self.isCordova = isCordova;
    self.username = 'TODO: username';

    self.init = function() {
      // wallet list change
      $rootScope.$on('updateWalletList', function(event) {
        console.log('E: updateWalletList'); //TODO
        self.walletSelection = false;
        self.setWallets();
      });

      $rootScope.$on('walletDelete', function(event, wid) {
        // TODO
        if (wid == $rootScope.wallet.id) {
          copay.logger.debug('Deleted focused wallet:', wid);

          // new focus
          var newWid = $rootScope.iden.getLastFocusedWalletId();
          if (newWid && $rootScope.iden.getWalletById(newWid)) {
            profileService.setFocusedWallet(newWid);
          } else {
            copay.logger.debug('No wallets');
            profileService.noFocusedWallet(newWid);
          }
        }
        self.walletSelection = false;
        self.setWallets();
      });

      // Fire up update on init
      $rootScope.$emit('updateWalletList');
    };

    self.signout = function() {
      profileService.signout();
    };

    self.switchWallet = function(wid) {
      self.walletSelection = false;
      profileService.setAndStoreFocus(wid, function() {});
      go.walletHome();
    };

    self.toggleWalletSelection = function() {
      self.walletSelection = !self.walletSelection;
      if (!self.walletSelection) return;
      self.setWallets();
    };

    self.setWallets = function() {
      if (!profileService.profile) return;
      var ret = lodash.map(profileService.profile.credentials, function(c) {
        return {
          m: c.m,
          n: c.n,
          name: c.walletName,
          id: c.walletId,
        };
      });
      self.wallets = lodash.sortBy(ret, 'walletName');
    };
  });
