'use strict';
angular.module('copayApp.controllers').controller('glideraUriController',
  function($scope, $stateParams, $timeout, profileService, glideraService, storageService, go) { 

    this.submitOauthCode = function(code) {
      var fc = profileService.focusedClient;
      var self = this;
      this.loading = true;
      this.error = null;
      $timeout(function() {
        glideraService.getToken(code, function(err, data) {
          self.loading = null;
          if (err) {
            self.error = err;
            $timeout(function() {
                $scope.$apply();
              }, 100);
          }
          else if (data && data.access_token) {
            storageService.setGlideraToken(fc.credentials.network, data.access_token, function() {
              $scope.$emit('Local/GlideraTokenUpdated', data.access_token);
              $timeout(function() {
                go.path('glidera');
                $scope.$apply();
              }, 100);
            });
          }
        });
      }, 100);
    };

    this.checkCode = function() {
      this.code = $stateParams.code;
      this.submitOauthCode(this.code);
    };

  });
