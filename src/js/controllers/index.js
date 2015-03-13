'use strict';

angular.module('copayApp.controllers').controller('indexController', function($rootScope, $log, go) {

  var self = this;

  $rootScope.$on('newFocusedWallet', function(event, walletStatus) {
    self.hasProfile = true;
    self.walletStatus = walletStatus;

    $log.debug('Setting new wallet:', walletStatus);

    $rootScope.$digest();
  });

  this.openMenu = function() {
    go.swipe(true);
  };

  this.closeMenu = function() {
    go.swipe();
  };
});
