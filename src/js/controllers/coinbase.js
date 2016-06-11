'use strict';

angular.module('copayApp.controllers').controller('coinbaseController',
  function($rootScope, $scope, $timeout, $modal, $ionicModal, profileService, configService, storageService, coinbaseService, lodash, platformInfo) {

    var isNW = platformInfo.isNW;

    this.openAuthenticateWindow = function() {
      var oauthUrl = this.getAuthenticateUrl();
      if (!isNW) {
        $rootScope.openExternalLink(oauthUrl, '_system');
      } else {
        var self = this;
        var gui = require('nw.gui');
        var win = gui.Window.open(oauthUrl, {
          focus: true,
          position: 'center'
        });
        win.on('loaded', function() {
          var title = win.title;
          if (title.indexOf('Coinbase') == -1) {
            $scope.code = title;
            self.submitOauthCode(title);
            win.close();
          }
        });
      }
    }

    this.getAuthenticateUrl = function() {
      return coinbaseService.getOauthCodeUrl();
    };

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
          } else if (data && data.access_token && data.refresh_token) {
            storageService.setCoinbaseToken(network, data.access_token, function() {
              storageService.setCoinbaseRefreshToken(network, data.refresh_token, function() {
                $scope.$emit('Local/CoinbaseUpdated', data.access_token);
                $timeout(function() {
                  $scope.$apply();
                }, 100);
              });
            });
          }
        });
      }, 100);
    };

    this.openTxModal = function(tx) {
      $scope.tx = tx;

      $ionicModal.fromTemplateUrl('views/modals/coinbase-tx-details.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(modal) {
        $scope.coinbaseTxDetailsModal = modal;
        $scope.coinbaseTxDetailsModal.show();
      });
    };

  });
