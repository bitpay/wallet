'use strict';

angular.module('copayApp.controllers').controller('buyAmazonController',
  function($rootScope, $scope, $ionicModal, $log, $timeout, lodash, profileService, bwcError, configService, walletService, fingerprintService, amazonService, ongoingProcess) {

    var self = this;
    var client;

    var handleEncryptedWallet = function(client, cb) {
      if (!walletService.isEncrypted(client)) return cb();
      $rootScope.$emit('Local/NeedsPassword', false, function(err, password) {
        if (err) return cb(err);
        return cb(walletService.unlock(client, password));
      });
    };

    this.init = function() {
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


      ongoingProcess.set('Processing Transaction...', true);
      $timeout(function() {

        amazonService.createBitPayInvoice(dataSrc, function(err, data) {
          if (err) {
            ongoingProcess.set('Processing Transaction...', false);
            self.error = bwcError.msg(err);
            $timeout(function() {
              $scope.$digest();
            });
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

          walletService.createTx(client, txp, function(err, createdTxp) {
            ongoingProcess.set('Processing Transaction...', false);
            if (err) {
              self.error = bwcError.msg(err);
              $timeout(function() {
                $scope.$digest();
              });
              return;
            }
            $scope.$emit('Local/NeedsConfirmation', createdTxp, function(accept) {
              if (accept) {
                self.confirmTx(createdTxp, function(err, tx) {
                  if (err) {
                    ongoingProcess.set('Processing Transaction...', false);
                    self.error = bwcError.msg(err);
                    $timeout(function() {
                      $scope.$digest();
                    });
                    return;
                  }
                  var gift = {
                    amount: dataSrc.price,
                    currencyCode: dataSrc.currency,
                    bitpayInvoiceId: data.data.id,
                    bitpayInvoiceUrl: data.data.url
                  };
                  ongoingProcess.set('Processing Transaction...', true);
                  amazonService.createGiftCard(gift, function(err, giftCard) {
                    ongoingProcess.set('Processing Transaction...', false);
                    if (err) {
                      self.error = bwcError.msg(err);
                      self.errorInfo = gift;
                      $timeout(function() {
                        $scope.$digest();
                      });
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
            return bwcError.cb(err, null, cb);
          }

          ongoingProcess.set('Processing Transaction...', true);
          walletService.publishTx(client, txp, function(err, publishedTxp) {
            if (err) {
              $log.debug(err);
              return bwcError.cb(err, null, cb);
            }

            walletService.signTx(client, publishedTxp, function(err, signedTxp) {
              walletService.lock(client);
              if (err) {
                $log.debug(err);
                walletService.removeTx(client, signedTxp, function(err) {
                  if (err) $log.debug(err);
                });
                return bwcError.cb(err, null, cb);
              }

              walletService.broadcastTx(client, signedTxp, function(err, broadcastedTxp) {
                if (err) {
                  $log.debug(err);
                  walletService.removeTx(client, broadcastedTxp, function(err) {
                    if (err) $log.debug(err);
                  });
                  return bwcError.cb(err, null, cb);
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
