'use strict';

angular.module('copayApp.controllers').controller('indexController', function($timeout, go, isCordova, identityService, notification) {

  this.openMenu = function() {
    go.swipe(true);
  };

  this.closeMenu = function() {
    go.swipe();
  };

});
