'use strict';

angular.module('copayApp.controllers').controller('preferencesGlideraController', 
  function($scope, $timeout, profileService, go, glideraService, storageService) {

    this.authenticateUrl = glideraService.getOauthCodeUrl();

    this.init = function(token) {
      var self = this;
      glideraService.getPermissions(token, function(error, permission) {
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

    this.submit = function(code) {
      var fc = profileService.focusedClient;
      glideraService.getToken(code, function(error, data) {
        if (data && data.status == 200) {
          storageService.setGlideraToken(fc.credentials.network, data.data.access_token, function() {
            $scope.$emit('Local/GlideraTokenUpdated');
            $timeout(function() {
              go.walletHome();
            }, 100);
          });
        }
      });
    };

    this.revokeToken = function() {
      var fc = profileService.focusedClient;
      storageService.removeGlideraToken(fc.credentials.network, function() {
        $scope.$emit('Local/GlideraTokenUpdated');
        $timeout(function() {
          go.walletHome();
        }, 100);
      });
    };

  });
