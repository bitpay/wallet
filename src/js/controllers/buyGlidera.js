'use strict';

angular.module('copayApp.controllers').controller('buyGlideraController',
  function($scope, $timeout, $ionicModal, profileService, addressService, glideraService, bwcError, lodash, ongoingProcess) {

    var self = this;
    this.show2faCodeInput = null;
    this.error = null;
    this.success = null;

    this.init = function(testnet) {
      self.allWallets = profileService.getWallets(testnet ? 'testnet' : 'livenet');

      var client = profileService.focusedClient;
      if (client) {
        $timeout(function() {
          self.selectedWalletId = client.credentials.walletId;
          self.selectedWalletName = client.credentials.walletName;
          $scope.$apply();
        }, 100);
      }
    };

    $scope.openWalletsModal = function(wallets) {
      self.error = null;

      $scope.type = 'BUY';
      $scope.wallets = wallets;
      $scope.noColor = true;
      $scope.self = self;

      $ionicModal.fromTemplateUrl('views/modals/wallets.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(modal) {
        $scope.walletsModal = modal;
        $scope.walletsModal.show();
      });

      $scope.$on('walletSelected', function(ev, walletId) {
        $timeout(function() {
          var client = profileService.getClient(walletId);
          self.selectedWalletId = walletId;
          self.selectedWalletName = client.credentials.walletName;
          $scope.$apply();
        }, 100);
        $scope.walletsModal.hide();
      });
    };

    this.getBuyPrice = function(token, price) {
      var self = this;
      this.error = null;
      if (!price || (price && !price.qty && !price.fiat)) {
        this.buyPrice = null;
        return;
      }
      this.gettingBuyPrice = true;
      glideraService.buyPrice(token, price, function(err, buyPrice) {
        self.gettingBuyPrice = false;
        if (err) {
          self.error = 'Could not get exchange information. Please, try again.';
          return;
        }
        self.buyPrice = buyPrice;
      });
    };

    this.get2faCode = function(token) {
      var self = this;
      self.error = null;
      ongoingProcess.set('Sending 2FA code...', true);
      $timeout(function() {
        glideraService.get2faCode(token, function(err, sent) {
          ongoingProcess.set('Sending 2FA code...', false);
          if (err) {
            self.error = 'Could not send confirmation code to your phone';
            return;
          }
          self.show2faCodeInput = sent;
        });
      }, 100);
    };

    this.sendRequest = function(token, permissions, twoFaCode) {
      var self = this;
      self.error = null;
      ongoingProcess.set('Buying Bitcoin...', true);
      $timeout(function() {
        addressService.getAddress(self.selectedWalletId, false, function(err, walletAddr) {
          if (err) {
            ongoingProcess.set('Buying Bitcoin...', false);
            self.error = bwcError.cb(err, 'Could not create address');
            return;
          }
          var data = {
            destinationAddress: walletAddr,
            qty: self.buyPrice.qty,
            priceUuid: self.buyPrice.priceUuid,
            useCurrentPrice: false,
            ip: null
          };
          glideraService.buy(token, twoFaCode, data, function(err, data) {
            ongoingProcess.set('Buying Bitcoin...', false);
            if (err) {
              self.error = err;
              return;
            }
            self.success = data;
            $scope.$emit('Local/GlideraTx');
          });
        });
      }, 100);
    };

  });
