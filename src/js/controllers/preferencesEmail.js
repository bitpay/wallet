'use strict';

angular.module('copayApp.controllers').controller('preferencesEmailController',
  function($scope, go,  profileService ,gettext, $log) {
    this.save = function(form) {
      this.error=null;

      if (!form.$valid) {
        this.error = gettext('Invalid email');
        return;
      }

console.log('[preferencesEmail.js.12]', this.email); //TODO
      var fc = profileService.focusedClient;
      this.saving =true;
      fc.savePreferences({email:this.email}, function(err) {
        fc.saving =false;
        if (err) {
          $log.warn(err);
          $scope.$emit('Local/ClientError', err);
          return;
        }
        go.walletHome();
      });
    };


  });
