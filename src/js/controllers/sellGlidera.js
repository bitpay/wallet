'use strict';

angular.module('copayApp.controllers').controller('sellGlideraController', 
  function($scope, $timeout, $log, gettext, configService, profileService, addressService, feeService, glideraService) {

    var config = configService.getSync();
    this.data = {};
    this.show2faCodeInput = null;
    this.success = null;
    this.currentSpendUnconfirmed = config.wallet.spendUnconfirmed;
    this.currentFeeLevel = config.wallet.settings.feeLevel || 'normal';

    this.getSellPrice = function(token, price) {
      var self = this;
      if (!price || (price && !price.qty && !price.fiat)) {
        this.sellPrice = null;
        return;
      }
      glideraService.sellPrice(token, price, function(error, sellPrice) {
        self.sellPrice = sellPrice;
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

    this.createTx = function(token, twoFaCode) {
      var self = this;
      var fc = profileService.focusedClient;

      $timeout(function() {
        addressService.getAddress(fc.credentials.walletId, null, function(err, refundAddress) {
          if (!refundAddress) return;
          glideraService.getSellAddress(token, function(error, sellAddress) {
            if (!sellAddress) return;
            var amount = parseInt((self.sellPrice.qty * 100000000).toFixed(0));

            feeService.getCurrentFeeValue(self.currentFeeLevel, function(err, feePerKb) {
              if (err) $log.debug(err);
              fc.sendTxProposal({
                toAddress: sellAddress,
                amount: amount,
                message: 'Glidera',
                payProUrl: null,
                feePerKb: feePerKb,
                excludeUnconfirmedUtxos: self.currentSpendUnconfirmed ? false : true
              }, function(err, txp) {
                if (err) {
                  profileService.lockFC();
                  $log.error(err);
                  return;
                }

                if (!fc.canSign()) {
                  $log.info('No signing proposal: No private key');
                  return;
                }

                _signTx(txp, function(err, rawTx) {
                  profileService.lockFC();
                  if (err) {
                    self.error = err.message ? err.message : gettext('The payment was created but could not be completed. Please try again from home screen');
                    $timeout(function() {
                      $scope.$digest();
                    }, 1);
                  }
                  else {
                    var data = {
                      refundAddress: refundAddress,
                      signedTransaction: rawTx,
                      priceUuid: self.sellPrice.priceUuid,
                      useCurrentPrice: false,
                      ip: null 
                    };
                    glideraService.sell(token, twoFaCode, data, function(error, data) {
                      self.success = data
                    });
                  }
                });
              });
            });
          });
        });

      }, 100);
    
    };

    var _signTx = function(txp, cb) {
      var self = this;
      var fc = profileService.focusedClient;
      fc.signTxProposal(txp, function(err, signedTx) {
        profileService.lockFC();
        if (err) {
          err.message = bwsError.msg(err, gettextCatalog.getString('The payment was created but could not be signed. Please try again from home screen'));
          return cb(err);
        }

        if (signedTx.status == 'accepted') {
          return cb(null, signedTx.raw);

        } else {
          return cb(true);
          console.log('NO ACCEPTED TX');
        }
      });
    };

  });
