'use strict';

angular.module('copayApp.controllers').controller('preferencesEmailController',
  function($scope, go, profileService, gettext, $log) {
    this.save = function(form) {
      var self = this;
      this.error = null;

      var fc = profileService.focusedClient;
      this.saving = true;
      fc.savePreferences({
        email: this.email
      }, function(err) {
        self.saving = false;
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
