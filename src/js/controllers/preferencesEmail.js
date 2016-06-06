'use strict';

angular.module('copayApp.controllers').controller('preferencesEmailController',
  function($scope, go, profileService, gettext, $log) {
    this.save = function(form) {
      var self = this;
      this.error = null;

      var fc = profileService.focusedClient;
      this.saving = true;
      $scope.$emit('Local/EmailSettingUpdated', fc,self.email, function() {
        self.saving = false;
        go.path('preferences');
      });
    };
  });
