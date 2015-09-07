'use strict';

angular.module('copayApp.controllers').controller('buyGlideraController', 
  function($scope, $timeout, profileService, addressService, glideraService, gettext) {
    
    this.addr = {};
    this.show2faCodeInput = null;
    this.error = null;
    this.success = null;

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
      this.loading = true;
      $timeout(function() {
        glideraService.get2faCode(token, function(err, sent) {
          self.loading = false;
          if (err) {
            self.error = gettext('Glidera could not the 2FA code to your phone');
          }
          else {
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
          self.loading = true;
          var data = {
            destinationAddress: addr,
            qty: self.buyPrice.qty,
            priceUuid: self.buyPrice.priceUuid,
            useCurrentPrice: false,
            ip: null 
          };
          $timeout(function() {
            glideraService.buy(token, twoFaCode, data, function(err, data) {
              self.loading = false;
              if (err) {
                self.error = gettext('Could not buy bitcoin');
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
