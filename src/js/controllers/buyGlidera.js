'use strict';

angular.module('copayApp.controllers').controller('buyGlideraController', 
  function($scope, $timeout, profileService, addressService, glideraService) {
    
    this.addr = {};
    this.show2faCodeInput = null;
    this.error = null;
    this.success = null;

    this.setDestinationAddress = function() {
      var self = this;
      this.addrError = null;
      var fc = profileService.focusedClient;
      if (!fc) return;

      $timeout(function() {
        addressService.getAddress(fc.credentials.walletId, null, function(err, addr) {
          if (err) {
            return;
          } else {
            if (addr) self.addr[fc.credentials.walletId] = addr;
          }
          $scope.$digest();
        });
      });
    };

    this.getBuyPrice = function(token, price) {
      var self = this;
      if (!price || (price && !price.qty && !price.fiat)) {
        this.buyPrice = null;
        return;
      }
      glideraService.buyPrice(token, price, function(error, buyPrice) {
        self.buyPrice = buyPrice;
      });     
    };

    this.get2faCode = function(token) {
      var self = this;
      $timeout(function() {
        glideraService.get2faCode(token, function(error, sent) {
          self.show2faCodeInput = sent;
        });
      }, 100);
    };

    this.sendRequest = function(token, twoFaCode) {
      var fc = profileService.focusedClient;
      if (!fc) return;
      this.loading = true;
      var self = this;
      addressService.getAddress(fc.credentials.walletId, null, function(err, addr) {
        if (addr) {
          var data = {
            destinationAddress: addr,
            qty: self.buyPrice.qty,
            priceUuid: self.buyPrice.priceUuid,
            useCurrentPrice: false,
            ip: null 
          };
console.log('[sellGlidera.js:128]',token, twoFaCode, addr, data); //TODO
          glideraService.buy(token, twoFaCode, data, function(error, data) {
console.log('[sellGlidera.js:116]', error, data); //TODO
            self.loading = false;
            if (error) {
              self.error = error;
            }
            else {
              self.success = data
            }
          });
        }
      });
    };

  });
