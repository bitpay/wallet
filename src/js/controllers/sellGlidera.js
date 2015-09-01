'use strict';

angular.module('copayApp.controllers').controller('sellGlideraController', 
  function($scope, $timeout, $log, gettext, configService, profileService, addressService, feeService, glideraService) {

    var config = configService.getSync();
    this.addr = {};
    this.data = {};
    this.sellAddress = null;
    this.show2faCodeInput = null;
    this.currentSpendUnconfirmed = config.wallet.spendUnconfirmed;
    this.currentFeeLevel = config.wallet.settings.feeLevel || 'normal';

    this.setRefundAddress = function() {
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

    this.setSellAddress = function(token) {
     var self = this;
     glideraService.getSellAddress(token, function(error, addr) {
       self.sellAddress = addr.sellAddress;
     });
    };

    this.getSellPrice = function(token, price) {
      var self = this;
      this.sellAmount = price.qty;
      glideraService.sellPrice(token, price, function(error, sellPrice) {
        self.sellPrice = sellPrice;
        self.setSellAddress(token);
        self.setRefundAddress();
      });     
    };

    this.createTx = function() {
      var self = this;
      var fc = profileService.focusedClient;

      $timeout(function() {
        var address = self.sellAddress;
        var amount = parseInt((self.sellAmount * 100000000).toFixed(0));

        feeService.getCurrentFeeValue(self.currentFeeLevel, function(err, feePerKb) {
          if (err) $log.debug(err);
          fc.sendTxProposal({
            toAddress: address,
            amount: amount,
            message: 'Glidera',
            payProUrl: null,
            feePerKb: feePerKb,
            excludeUnconfirmedUtxos: self.currentSpendUnconfirmed ? false : true
          }, function(err, txp) {
console.log('[sellGlidera.js:62]',txp); //TODO
            if (err) {
              profileService.lockFC();
              $log.error(err);
              return;
            }

            if (!fc.canSign()) {
              $log.info('No signing proposal: No private key');
              return;
            }

            self.signTx(txp, function(err, raw) {
              profileService.lockFC();
              if (err) {
                self.error = err.message ? err.message : gettext('The payment was created but could not be completed. Please try again from home screen');
                $timeout(function() {
                  $scope.$digest();
                }, 1);
              }
              else {
                return raw;
              }
            });
          });
        });

      }, 100);
    
    };

    this.signTx = function(txp, cb) {
      var self = this;
      var fc = profileService.focusedClient;
      fc.signTxProposal(txp, function(err, signedTx) {
        console.log('[sellGlidera.js:96]',signedTx); //TODO
        profileService.lockFC();
        if (err) {
          err.message = bwsError.msg(err, gettextCatalog.getString('The payment was created but could not be signed. Please try again from home screen'));
          return cb(err);
        }

        if (signedTx.status == 'accepted') {
          var t = profileService.getUtils().buildTx(signedTx);
          var raw = t.uncheckedSerialize();
          console.log('[sellGlidera.js:104]',raw); //TODO 
          return cb(null, raw);

        } else {
          console.log('NO ACCEPTED TX');

        }
      });
    };

    this.get2faCode = function(token, cb) {
      var self = this;
      glideraService.get2faCode(token, function(error, sent) {
        self.show2faCodeInput = sent;
      });
    };

    this.sendTx = function(token, twoFaCode, raw) {
      var fc = profileService.focusedClient;
      var self = this;
      var data = {
        refundAddress: self.addr[fc.credentials.walletId],
        signedTransaction: raw,
        priceUuid: self.sellPrice.priceUuid,
        useCurrentPrice: false,
        ip: null 
      };
console.log('[sellGlidera.js:128]',token, twoFaCode, data); //TODO
      glideraService.sell(token, twoFaCode, data, function(error, data) {
console.log('[sellGlidera.js:116]',data); //TODO
          
          });
    
    };


  });
