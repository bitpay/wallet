'use strict';

angular.module('copayApp.controllers').controller('buyGlideraController', 
  function($scope, $timeout, profileService, addressService, glideraService, gettext) {
    
    this.addr = {};
    this.show2faCodeInput = null;
    this.error = null;
    this.success = null;
    this.loading = null; 

    this.getBuyPrice = function(token, price) {
      var self = this;
      if (!price || (price && !price.qty && !price.fiat)) {
        this.buyPrice = null;
        return;
      }
      glideraService.buyPrice(token, price, function(err, buyPrice) {
        if (err) {
          self.error = gettext('Glidera could not get pricing to buy bitcoin');
        }
        else {
          self.buyPrice = buyPrice;
        }
      });     
    };

    this.get2faCode = function(token) {
      var self = this;
      this.loading = gettext('Sending 2FA code...');
      $timeout(function() {
        glideraService.get2faCode(token, function(err, sent) {
          self.loading = null;
          if (err) {
            self.error = gettext('Glidera could not send the 2FA code to your phone');
          }
          else {
            self.error = null;
            self.show2faCodeInput = sent;
          }
        });
      }, 100);
    };

    this.sendRequest = function(token, permissions, twoFaCode) {
      var fc = profileService.focusedClient;
      if (!fc) return;
      var self = this;
      self.error = null;
      addressService.getAddress(fc.credentials.walletId, null, function(err, addr) {
        if (!addr) {
          self.error = gettext('Could not get the bitcoin address');
          $scope.$apply();
        }
        else {
          self.loading = gettext('Buying bitcoin...');
          var data = {
            destinationAddress: addr,
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
                $scope.$emit('Local/GlideraUpdated', token, permissions);
              }
            });
          }, 100);
        }
      });
    };

  });
