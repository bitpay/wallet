'use strict';

angular.module('copayApp.controllers').controller('createProfileController', function($rootScope, profileService, go) {

  var _credentials;

  this.init = function() {
    // TODO
    if ($rootScope.wallet)
      go.walletHome();

    $rootScope.$on('pin', function(event, pin) {
      profileService.create(pin, function(err) {
        console.log('[createProfile.js.14]'); //TODO
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
