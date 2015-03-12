'use strict';

angular.module('copayApp.controllers').controller('sidebarController', 
  function($rootScope, $timeout, profileService, isMobile, isCordova, go) {

  this.isMobile = isMobile.any();
  this.isCordova = isCordova;
  this.username = $rootScope.iden ? $rootScope.iden.username : 'Undefined';

  this.signout = function() {
    profileService.signout();
  };

  this.switchWallet = function(wid) {
    this.walletSelection = false;
    profileService.setFocusedWallet(wid);
    go.walletHome();
  };

  this.toggleWalletSelection = function() {
    this.walletSelection = !this.walletSelection;
    if (!this.walletSelection) return;
    this.setWallets();
  }; 

  this.init = function() {
    // This should be called only once.

    // focused wallet change
    if ($rootScope.wallet) {
      $rootScope.$watch('wallet', function() {
        this.walletSelection = false;
        this.setWallets();
      });
    }

    // wallet list change
    if ($rootScope.iden) {
      var iden = $rootScope.iden;
      iden.on('newWallet', function() {
        this.walletSelection = false;
        this.setWallets();
      });
      iden.on('walletDeleted', function(wid) {
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
        this.walletSelection = false;
        this.setWallets();
      });
    }
  };

  this.setWallets = function() {
    if (!$rootScope.iden) return;
    var ret = _.filter($rootScope.iden.getWallets(), function(w) {
      return w;
    });
    this.wallets = _.sortBy(ret, 'name');
  };
});
