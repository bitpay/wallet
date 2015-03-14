'use strict';

angular.module('copayApp.controllers').controller('createProfileController', function($rootScope, profileService, go) {

  var _credentials;

  if (profileService.profile)
    go.walletHome();

  $rootScope.$on('pin', function(event, pin) {

    profileService.create(pin, function(err) {
      if (err) {
        this.error = err;
        console.log('[createProfile.js.16:err:]', err); //TODO
        // TODO -> mostrar error o algo...
      } else {
        go.walletHome();
      }
    });
  });
});
