'use strict';

angular.module('copayApp.controllers').controller('indexController', function($timeout, go, isCordova, profileService, notification) {

  this.openMenu = function() {
    go.swipe(true);
  };

  this.closeMenu = function() {
    go.swipe();
  };

});
