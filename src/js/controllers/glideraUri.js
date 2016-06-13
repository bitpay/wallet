'use strict';
angular.module('copayApp.controllers').controller('glideraUriController',
  function($scope, $log, $stateParams, $timeout, profileService, configService, glideraService, storageService, go, ongoingProcess) {

    this.submitOauthCode = function(code) {
      $log.debug('Glidera Oauth Code:' + code);
      var self = this;
      var glideraTestnet = configService.getSync().glidera.testnet;
      var network = glideraTestnet ? 'testnet' : 'livenet';
      ongoingProcess.set('connectingGlidera', true);
      this.error = null;
      $timeout(function() {
        glideraService.getToken(code, function(err, data) {
          ongoingProcess.set('connectingGlidera', false);
          if (err) {
            self.error = err;
            $timeout(function() {
              $scope.$apply();
            }, 100);
          } else if (data && data.access_token) {
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
      if ($stateParams.url) {
        var match = $stateParams.url.match(/code=(.+)/);
        if (match && match[1]) {
          this.code = match[1];
          return this.submitOauthCode(this.code);
        }
      }
      $log.error('Bad state: ' + JSON.stringify($stateParams));
    }
  });
