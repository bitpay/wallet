'use strict';

angular.module('copayApp.controllers').controller('preferencesGlideraController', 
  function($scope, $timeout, profileService, applicationService, glideraService, storageService) {

    this.init = function(token) {
      var self = this;
      glideraService.getAccessTokenPermissions(token, function(error, permission) {
        self.permission = permission;
      });

      glideraService.getEmail(token, function(error, email) {
        self.email = email;
      });

      glideraService.getPersonalInfo(token, function(error, info) {
        self.personalInfo = info;
      });

      glideraService.getStatus(token, function(error, status) {
        self.status = status;
      });

      glideraService.getLimits(token, function(error, limits) {
        self.limits = limits;
      });
    }; 

    this.revokeToken = function() {
      var fc = profileService.focusedClient;
      storageService.removeGlideraToken(fc.credentials.network, function() {
        $timeout(function() {
          applicationService.restart();
        }, 100);
      });
    };

  });
