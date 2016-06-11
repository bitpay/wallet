'use strict';
angular.module('copayApp.controllers').controller('glideraUriController',
  function($scope, $stateParams, $timeout, profileService, configService, glideraService, storageService, go) { 

    this.submitOauthCode = function(code) {
console.log('[glideraUri.js.5:code:]'+code); //TODO
      var self = this;
      var glideraTestnet = configService.getSync().glidera.testnet;
      var network = glideraTestnet ? 'testnet' : 'livenet';
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
            storageService.setGlideraToken(network, data.access_token, function() {
              $scope.$emit('Local/GlideraUpdated', data.access_token);
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
console.log('[glideraUri.js.35:$stateParams:]' + JSON.stringify($stateParams)); //TODO
      this.code = $stateParams.code;
      this.submitOauthCode(this.code);
    };

  });
