'use strict';

angular.module('copayApp.controllers').controller('buyGlideraController',
  function($scope, $timeout, $modal, $ionicModal, profileService, addressService, glideraService, bwsError, lodash) {

    var self = this;
    this.show2faCodeInput = null;
    this.error = null;
    this.success = null;
    this.loading = null;
    var otherWallets = function(testnet) {
      var network = testnet ? 'testnet' : 'livenet';
      return lodash.filter(profileService.getWallets(network), function(w) {
        return w.network == network;
      });
    };

    this.init = function(testnet) {
      self.otherWallets = otherWallets(testnet);
      // Choose focused wallet
      try {
        var currentWalletId = profileService.focusedClient.credentials.walletId;
        lodash.find(self.otherWallets, function(w) {
          if (w.id == currentWalletId) {
            $timeout(function() {
              self.selectedWalletId = w.id;
              self.selectedWalletName = w.name;
              $scope.$apply();
            }, 100);
          }
        });
      } catch (e) {
        $log.debug(e);
      };
    };

    $scope.openWalletsModal = function(wallets) {
      self.error = null;
      self.selectedWalletId = null;
      self.selectedWalletName = null;

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
      self.loading = 'Sending 2FA code...';
      $timeout(function() {
        glideraService.get2faCode(token, function(err, sent) {
          self.loading = null;
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
      self.loading = 'Buying bitcoin...';
      $timeout(function() {
        addressService.getAddress(self.selectedWalletId, false, function(err, walletAddr) {
          if (err) {
            self.error = bwsError.cb(err, 'Could not create address');
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
            self.loading = null;
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
