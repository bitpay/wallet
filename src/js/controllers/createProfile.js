'use strict';

angular.module('copayApp.controllers').controller('createProfileController', function($rootScope, go) {

  var _credentials;

  this.init = function() {

    // TODO
    if ($rootScope.wallet)
      go.walletHome();

    $rootScope.$on('pin', function(event, pin) {
      console.log('[createProfile.js.13:pin:]', pin); //TODO
      profileService.create(pin, function(err) {
        if (err) {
          console.log('[createProfile.js.16:err:]', err); //TODO
          // TODO -> mostrar error o algo...
        } else {
          go.walletHome();
        }
      });
    });

  };
});
