'use strict';

angular.module('copayApp.controllers').controller('buyAmazonController', 
  function($rootScope, $scope, $modal, $log, $timeout, lodash, profileService, animationService, bwsError, configService, walletService, fingerprintService, amazonService) {
    
    window.ignoreMobilePause = true;
    var self = this;
    var fc;
    var minimumAmount = 1;
    var stepAmount = 1;
    var multiplierAmount = 2;
    var maximumAmount = 10;

    var otherWallets = function(network) {
      return lodash.filter(profileService.getWallets(network), function(w) {
        return w.network == network && w.m == 1;
      });
    };

    var handleEncryptedWallet = function(client, cb) {
      if (!walletService.isEncrypted(client)) return cb();
      $rootScope.$emit('Local/NeedsPassword', false, function(err, password) {
        if (err) return cb(err);
        return cb(walletService.unlock(client, password));
      });
    };

    this.init = function() {
      $scope.fiat = minimumAmount * multiplierAmount;
      var network = configService.getSync().amazon.testnet ? 'testnet' : 'livenet';
      amazonService.setCredentials(network);
      self.otherWallets = otherWallets(network);
      // Choose focused wallet
      try {
        var currentWalletId = profileService.focusedClient.credentials.walletId;
        lodash.find(self.otherWallets, function(w) {
          if (w.id == currentWalletId) {
            $timeout(function() {
              self.selectedWalletId = w.id;
              self.selectedWalletName = w.name;
              fc = profileService.getClient(w.id);
              $scope.$apply();
            }, 100);
          }
        });
      } catch (e) {
        $log.debug(e);
      };
    };

    $scope.openWalletsModal = function(wallets) {
      if (self.loading) return;
      self.error = null;
      self.errorInfo = null;
      var ModalInstanceCtrl = function($scope, $modalInstance) {
        $scope.type = 'SELL';
        $scope.wallets = wallets;
        $scope.noColor = true;
        $scope.cancel = function() {
          $modalInstance.dismiss('cancel');
        };

        $scope.selectWallet = function(walletId, walletName) {
          if (!profileService.getClient(walletId).isComplete()) {
            self.error = bwsError.msg('WALLET_NOT_COMPLETE');
            $modalInstance.dismiss('cancel');
            return;
          }
          $modalInstance.close({
            'walletId': walletId,
            'walletName': walletName,
          });
        };
      };

      var modalInstance = $modal.open({
        templateUrl: 'views/modals/wallets.html',
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
          fc = profileService.getClient(obj.walletId);
          $scope.$apply();
        }, 100);
      });
    };

    this.setAmount = function(plus) {
      if (self.loading) return;
      if (plus && $scope.fiat < maximumAmount ) {
        stepAmount = stepAmount + 1;
        $scope.fiat = stepAmount * multiplierAmount;
      } else if (!plus && $scope.fiat > minimumAmount * multiplierAmount) {
        stepAmount = stepAmount - 1;
        $scope.fiat = stepAmount * multiplierAmount;
      }
    };

    this.createTx = function() {
      self.error = null;
      self.errorInfo = null;

      var currency_code = configService.getSync().amazon.testnet ? window.amazon_sandbox_currency_code : window.amazon_currency_code;
      var dataSrc = { 
        price: $scope.fiat,
        currency: currency_code
      };
      var outputs = [];
      var config = configService.getSync();
      var configWallet = config.wallet;
      var walletSettings = configWallet.settings;


      self.loading = 'Creating invoice...';
      $timeout(function() {

        amazonService.createBitPayInvoice(dataSrc, function(err, data) {
          if (err) {
            self.loading = null;
            self.error = err;
            return;
          }

          var address, comment, amount;

          address = data.data.bitcoinAddress;
          amount = parseInt((data.data.btcPrice * 100000000).toFixed(0));
          comment = 'Amazon.com Gift Card';

          outputs.push({
            'toAddress': address,
            'amount': amount,
            'message': comment
          });
          
          var txp = {
            toAddress: address,
            amount: amount,
            outputs: outputs,
            message: comment,
            payProUrl: null,
            excludeUnconfirmedUtxos: configWallet.spendUnconfirmed ? false : true,
            feeLevel: walletSettings.feeLevel || 'normal'
          };

          self.loading = 'Creating transaction...';
          walletService.createTx(fc, txp, function(err, createdTxp) {
            self.loading = null;
            if (err) {
              self.loading = null;
              $log.debug(err);
              self.error = bwsError.msg(err);
              $scope.$apply();
              return;
            }
            $scope.$emit('Local/NeedsConfirmation', createdTxp, function(accept) {
              if (accept) { 
                self.loading = 'Sending bitcoin...';
                self.confirmTx(createdTxp, function(err, tx) {
                  if (err) { 
                    self.loading = null;
                    self.error = err;
                    return;
                  }
                  var gift = {
                    amount: dataSrc.price,
                    currencyCode: dataSrc.currency,
                    bitpayInvoiceId: data.data.id,
                    bitpayInvoiceUrl: data.data.url
                  };
                  self.loading = 'Creating gift card...';
                  amazonService.createGiftCard(gift, function(err, giftCard) {
                    self.loading = null;
                    if (err) { 
                      self.error = err;
                      self.errorInfo = gift;
                      return;
                    }
                    self.giftCard = giftCard;
                    $timeout(function() {
                      $scope.$digest();
                    });
                  });
                });
              }
            });
          });
        });
      }, 100);
    };

    this.confirmTx = function(txp, cb) {

      fingerprintService.check(fc, function(err) {
        if (err) {
          $log.debug(err);
          return cb(err);
        }

        handleEncryptedWallet(fc, function(err) {
          if (err) {
            $log.debug(err);
            return bwsError.cb(err, null, cb);
          }

          walletService.publishTx(fc, txp, function(err, publishedTxp) {
            if (err) {
              $log.debug(err);
              return bwsError.cb(err, null, cb);
            }

            walletService.signTx(fc, publishedTxp, function(err, signedTxp) {
              walletService.lock(fc);
              if (err) {
                $log.debug(err);
                walletService.removeTx(fc, signedTxp, function(err) {
                  if (err) $log.debug(err);
                });
                return bwsError.cb(err, null, cb);
              }

              walletService.broadcastTx(fc, signedTxp, function(err, broadcastedTxp) {
                if (err) {
                  $log.debug(err);
                  walletService.removeTx(fc, broadcastedTxp, function(err) {
                    if (err) $log.debug(err);
                  });
                  return bwsError.cb(err, null, cb);
                }
                $timeout(function() {
                  return cb(null, broadcastedTxp);
                }, 5000);
              });
            });
          });
        });
      });
    };

  });
