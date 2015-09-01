'use strict';

angular.module('copayApp.controllers').controller('buyGlideraController', 
  function($scope, $timeout, profileService, addressService, glideraService) {
    
    this.addr = {};

    this.setDestinationAddress = function() {
      var self = this;
      this.addrError = null;
      var fc = profileService.focusedClient;
      if (!fc) return;

      $timeout(function() {
        addressService.getAddress(fc.credentials.walletId, null, function(err, addr) {
          if (err) {
            self.addrError = err;
          } else {
            if (addr) self.addr[fc.credentials.walletId] = addr;
          }
          $scope.$digest();
        });
      });
    };

    this.getBuyPrice = function(token, price) {
      var self = this;
      this.buyAmount = price.qty;
      glideraService.buyPrice(token, price, function(error, buyPrice) {
        self.buyPrice = buyPrice;
        self.setDestinationAddress();
      });     
    };

    this.get2faCode = function(token, cb) {
      var self = this;
      glideraService.get2faCode(token, function(error, sent) {
        self.show2faCodeInput = sent;
      });
    };

    this.send = function(token, twoFaCode) {
      var fc = profileService.focusedClient;
      var self = this;
      var data = {
        destinationAddress: self.addr[fc.credentials.walletId],
        qty: self.buyPrice.qty,
        priceUuid: self.buyPrice.priceUuid,
        useCurrentPrice: false,
        ip: null 
      };
console.log('[sellGlidera.js:128]',token, twoFaCode, data); //TODO
      glideraService.buy(token, twoFaCode, data, function(error, data) {
console.log('[sellGlidera.js:116]',data); //TODO
          
          });
    
    };

  });
