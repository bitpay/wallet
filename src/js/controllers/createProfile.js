'use strict';

angular.module('copayApp.controllers').controller('createProfileController', function($rootScope, $log, profileService, go) {

  var _credentials;

  if (profileService.profile)
    go.walletHome();

  $rootScope.$on('pin', function(event, pin) {
    profileService.create(pin, function(err) {
      if (err) {
        $log.warn(err);
        this.error = err;
        // TODO -> mostrar error o algo...
      } else {
        go.walletHome();
      }
    });
  });
});
