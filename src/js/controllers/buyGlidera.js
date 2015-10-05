'use strict';

angular.module('copayApp.controllers').controller('buyGlideraController', 
  function($scope, $timeout, $modal, profileService, addressService, glideraService, bwsError, lodash, isChromeApp, animationService) {
    
    var self = this;
    this.show2faCodeInput = null;
    this.error = null;
    this.success = null;
    this.loading = null; 

    this.otherWallets = function(testnet) {
      var network = testnet ? 'testnet' : 'livenet';
      return lodash.filter(profileService.getWallets(network), function(w) {
        return w.network == network;
      });
    };

    $scope.openWalletsModal = function(wallets) {
      self.error = null;
      self.selectedWalletId = null;
      self.selectedWalletName = null;
      self.selectedWalletAddr = null;
      var ModalInstanceCtrl = function($scope, $modalInstance) {
        $scope.type = 'BUY';
        $scope.wallets = wallets;
        $scope.cancel = function() {
          $modalInstance.dismiss('cancel');
        };

        $scope.selectWallet = function(walletId, walletName) {
          if (!profileService.getClient(walletId).isComplete()) {
            self.error = bwsError.msg({'code': 'WALLET_NOT_COMPLETE'}, 'Could not choose the wallet');
            $modalInstance.dismiss('cancel');
            return;
          }
          addressService.getAddress(walletId, false, function(err, walletAddr) {
            if (err) {
              self.error = bwsError.cb(err, 'Could not create address');
              $modalInstance.dismiss('cancel');
              return;
            }
            $modalInstance.close({
              'walletId': walletId, 
              'walletName': walletName, 
              'walletAddr': walletAddr
            });
          });
        };
      };

      var modalInstance = $modal.open({
        templateUrl: 'views/modals/glidera-wallets.html',
          windowClass: animationService.modalAnimated.slideUp,
          controller: ModalInstanceCtrl,
      });

      modalInstance.result.finally(function() {
        var m = angular.element(document.getElementsByClassName('reveal-modal'));
        m.addClass(animationService.modalAnimated.slideOutDown);
      });

      modalInstance.result.then(function(obj) {
        $timeout(function() {
          self.selectedWalletId = obj.walletId;
          self.selectedWalletName = obj.walletName;
          self.selectedWalletAddr = obj.walletAddr;
          $scope.$apply();
        }, 100);
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
        }
        else {
          self.buyPrice = buyPrice;
        }
      });     
    };

    this.get2faCode = function(token) {
      var self = this;
      this.loading = 'Sending 2FA code...';
      $timeout(function() {
        glideraService.get2faCode(token, function(err, sent) {
          self.loading = null;
          if (err) {
            self.error = 'Could not send confirmation code to your phone';
          }
          else {
            self.error = null;
            self.show2faCodeInput = sent;
          }
        });
      }, 100);
    };

    this.sendRequest = function(token, permissions, twoFaCode) {
      var self = this;
      self.error = null;
      self.loading = 'Buying bitcoin...';
      var data = {
        destinationAddress: self.selectedWalletAddr,
        qty: self.buyPrice.qty,
        priceUuid: self.buyPrice.priceUuid,
        useCurrentPrice: false,
        ip: null 
      };
      $timeout(function() {
        glideraService.buy(token, twoFaCode, data, function(err, data) {
          self.loading = null;
          if (err) {
            self.error = err;
          }
          else {
            self.success = data;
            $scope.$emit('Local/GlideraTx');
          }
        });
      }, 100);
    };

  });
