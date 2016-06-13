'use strict';

angular.module('copayApp.controllers').controller('preferencesEmailController',
  function($rootScope, go, profileService, gettext, $log, walletService) {
    this.save = function(form) {
      var self = this;
      this.error = null;

      var fc = profileService.focusedClient;
      var email = self.email || '';

      walletService.updateRemotePreferences(fc, {
        email: email,
      }, function(err) {
        if (!err)
          $rootScope.$emit('Local/EmailUpdated', email);

        go.path('preferences');
      });
    };
  });
