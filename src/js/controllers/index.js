'use strict';

angular.module('copayApp.controllers').controller('indexController', function($rootScope, $log, go, profileService) {

  var self = this;

  $rootScope.$on('newProfile', function() {
    self.hasProfile = !!profileService.profile;
    self.status = profileService.focusedStatus;
    $log.debug('Setting profile:', self.status);
  });

  this.openMenu = function() {
    go.swipe(true);
  };

  this.closeMenu = function() {
    go.swipe();
  };
});
