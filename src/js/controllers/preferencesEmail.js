'use strict';

angular.module('copayApp.controllers').controller('preferencesEmailController',
  function($scope, go, profileService, gettext, $log) {
    this.save = function(form) {
      this.error = null;

      if (!form.$valid && this.email) {
        this.error = gettext('Invalid email');
        return;
      }

      var fc = profileService.focusedClient;
      this.saving = true;
      fc.savePreferences({
        email: this.email
      }, function(err) {
        fc.saving = false;
        if (err) {
          $log.warn(err);
          $scope.$emit('Local/ClientError', err);
          return;
        }
        $scope.$emit('Local/EmailUpdated', function(err){
          go.path('preferences');
        });
      });
    };


  });
