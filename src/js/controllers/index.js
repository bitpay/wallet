'use strict';

angular.module('copayApp.controllers').controller('indexController', function($rootScope, go, profileService) {

  var self = this;

  $rootScope.$on('newProfile', function() {
    self.hasProfile = !!profileService.profile;
  });

  this.openMenu = function() {
    go.swipe(true);
  };

  this.closeMenu = function() {
    go.swipe();
  };
});
