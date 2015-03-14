'use strict';

angular.module('copayApp.controllers').controller('indexController', function($rootScope, $log, go) {

  this.pageLoaded = false;
  var self = this;

  $rootScope.$on('newFocusedWallet', function(event, walletStatus) {
    $log.debug('Setting new wallet:', walletStatus);
    self.pageLoaded = true;
    self.hasProfile = true;
    self.walletStatus = walletStatus;
    $rootScope.$apply();
  });

  this.openMenu = function() {
    go.swipe(true);
  };

  this.closeMenu = function() {
    go.swipe();
  };
});
