'use strict';

angular.module('copayApp.controllers').controller('coinbaseController', 
  function($rootScope, $scope, $timeout, $modal, profileService, configService, storageService, coinbaseService, isChromeApp, animationService, lodash, nodeWebkit) {

    window.ignoreMobilePause = true;
    
    this.openAuthenticateWindow = function() {
      var oauthUrl = this.getAuthenticateUrl();
      if (!nodeWebkit.isDefined()) {
        $rootScope.openExternalLink(oauthUrl, '_system');
      } else {
        var self = this;
        var gui = require('nw.gui');
        var win = gui.Window.open(oauthUrl, {
          focus: true,
          position: 'center'
        });
        win.on ('loaded', function(){
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
          }
          else if (data && data.access_token && data.refresh_token) {
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
      $rootScope.modalOpened = true;
      var self = this;
      var config = configService.getSync().wallet.settings;
      var fc = profileService.focusedClient;
      var ModalInstanceCtrl = function($scope, $modalInstance) {
        $scope.tx = tx;
        $scope.settings = config;
        $scope.color = fc.backgroundColor;
        $scope.noColor = true;

        $scope.remove = function() {
          coinbaseService.savePendingTransaction($scope.tx, {remove: true}, function(err) {
            $rootScope.$emit('Local/CoinbaseTx');
            $scope.cancel();
          });
        };

        $scope.cancel = lodash.debounce(function() {
          $modalInstance.dismiss('cancel');
        }, 0, 1000);

      };

      var modalInstance = $modal.open({
        templateUrl: 'views/modals/coinbase-tx-details.html',
          windowClass: animationService.modalAnimated.slideRight,
          controller: ModalInstanceCtrl,
      });

      var disableCloseModal = $rootScope.$on('closeModal', function() {
        modalInstance.dismiss('cancel');
      });

      modalInstance.result.finally(function() {
        $rootScope.modalOpened = false;
        disableCloseModal();
        var m = angular.element(document.getElementsByClassName('reveal-modal'));
        m.addClass(animationService.modalAnimated.slideOutRight);
      });
    };

  });
