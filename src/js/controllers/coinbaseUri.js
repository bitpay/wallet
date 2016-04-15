'use strict';
angular.module('copayApp.controllers').controller('coinbaseUriController',
  function($scope, $stateParams, $timeout, profileService, configService, coinbaseService, storageService, go) { 

    this.submitOauthCode = function(code) {
      var self = this;
      var coinbaseTestnet = configService.getSync().coinbase.testnet;
      var network = coinbaseTestnet ? 'testnet' : 'livenet';
      this.loading = true;
      this.error = null;
      $timeout(function() {
        coinbaseService.getToken(code, function(err, data) {
          self.loading = null;
          if (err) {
            self.error = err;
            $timeout(function() {
                $scope.$apply();
              }, 100);
          }
          else if (data && data.access_token && data.refresh_token) {
            storageService.setCoinbaseToken(network, data.access_token, function() {
              storageService.setCoinbaseRefreshToken(network, data.refresh_token, function() {
                $scope.$emit('Local/CoinbaseUpdated', data.access_token);
                $timeout(function() {
                  go.path('coinbase');
                  $scope.$apply();
                }, 100);
              });
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
