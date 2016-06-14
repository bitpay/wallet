'use strict';

angular.module('copayApp.controllers').controller('buyAmazonController', 
  function($rootScope, $scope, $ionicModal, $log, $timeout, lodash, profileService, bwsError, configService, walletService, fingerprintService, amazonService, ongoingProcess) {
    
    var self = this;
    var client;
    var minimumAmount = 5;
    var stepAmount = 1;
    var multiplierAmount = 5;
    var maximumAmount = 500;

    var handleEncryptedWallet = function(client, cb) {
      if (!walletService.isEncrypted(client)) return cb();
      $rootScope.$emit('Local/NeedsPassword', false, function(err, password) {
        if (err) return cb(err);
        return cb(walletService.unlock(client, password));
      });
    };

    this.init = function() {
      $scope.fiat = minimumAmount;
      var network = configService.getSync().amazon.testnet ? 'testnet' : 'livenet';
      amazonService.setCredentials(network);
      amazonService.healthCheckRequest();
      amazonService.initUuid();
      self.allWallets = profileService.getWallets(network, 1);
      client = profileService.focusedClient;
      if (client && client.credentials.m == 1) { 
        $timeout(function() {
          self.selectedWalletId = client.credentials.walletId;
          self.selectedWalletName = client.credentials.walletName;
          $scope.$apply();
        }, 100);
      }
    };

    $scope.openWalletsModal = function(wallets) {
      self.error = null;

      $scope.type = 'SELL';
      $scope.wallets = wallets;

      $ionicModal.fromTemplateUrl('views/modals/wallets.html', {
        scope: $scope
      }).then(function(modal) {
        $scope.walletsModal = modal;
        $scope.walletsModal.show();
      });

      $scope.$on('walletSelected', function(ev, obj) {
        $timeout(function() {
          self.selectedWalletId = obj.walletId;
          self.selectedWalletName = obj.walletName;
          client = obj.client;
          $scope.$apply();
        }, 100);
        $scope.walletsModal.hide();
      });
    };

    this.setAmount = function(plus) {
      if (plus && $scope.fiat < maximumAmount ) {
        stepAmount = stepAmount + 1;
        $scope.fiat = stepAmount * multiplierAmount;
      } else if (!plus && $scope.fiat > minimumAmount) {
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
        currency: currency_code,
        orderId: self.selectedWalletName
      };
      var outputs = [];
      var config = configService.getSync();
      var configWallet = config.wallet;
      var walletSettings = configWallet.settings;


      ongoingProcess.set('Creating invoice...', true);
      $timeout(function() {

        amazonService.createBitPayInvoice(dataSrc, function(err, data) {
          ongoingProcess.set('Creating invoice...', false);
          if (err) {
            self.error = bwsError.msg(err);
            $scope.$apply();
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

          ongoingProcess.set('Creating transaction...', true);
          walletService.createTx(client, txp, function(err, createdTxp) {
            ongoingProcess.set('Creating transaction...', false);
            if (err) {
              self.error = bwsError.msg(err);
              $scope.$apply();
              return;
            }
            $scope.$emit('Local/NeedsConfirmation', createdTxp, function(accept) {
              if (accept) { 
                ongoingProcess.set('Sending bitcoin...', true);
                self.confirmTx(createdTxp, function(err, tx) {
                  ongoingProcess.set('Sending bitcoin...', false);
                  if (err) { 
                    self.error = bwsError.msg(err);
                    $scope.$apply();
                    return;
                  }
                  var gift = {
                    amount: dataSrc.price,
                    currencyCode: dataSrc.currency,
                    bitpayInvoiceId: data.data.id,
                    bitpayInvoiceUrl: data.data.url
                  };
                  ongoingProcess.set('Creating gift card...', true);
                  amazonService.createGiftCard(gift, function(err, giftCard) {
                    ongoingProcess.set('Creating gift card...', false);
                    if (err) { 
                      self.error = bwsError.msg(err);
                      self.errorInfo = gift;
                      $scope.$apply();
                      return;
                    }
                    amazonService.setAmountByDay(dataSrc.price);
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

      fingerprintService.check(client, function(err) {
        if (err) {
          $log.debug(err);
          return cb(err);
        }

        handleEncryptedWallet(client, function(err) {
          if (err) {
            $log.debug(err);
            return bwsError.cb(err, null, cb);
          }

          walletService.publishTx(client, txp, function(err, publishedTxp) {
            if (err) {
              $log.debug(err);
              return bwsError.cb(err, null, cb);
            }

            walletService.signTx(client, publishedTxp, function(err, signedTxp) {
              walletService.lock(client);
              if (err) {
                $log.debug(err);
                walletService.removeTx(client, signedTxp, function(err) {
                  if (err) $log.debug(err);
                });
                return bwsError.cb(err, null, cb);
              }

              walletService.broadcastTx(client, signedTxp, function(err, broadcastedTxp) {
                if (err) {
                  $log.debug(err);
                  walletService.removeTx(client, broadcastedTxp, function(err) {
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
