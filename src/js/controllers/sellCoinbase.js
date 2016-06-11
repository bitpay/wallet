'use strict';

angular.module('copayApp.controllers').controller('sellCoinbaseController',
  function($rootScope, $scope, $modal, $log, $timeout, $ionicModal, lodash, profileService, coinbaseService, bwsError, configService, walletService, fingerprintService) {

    var self = this;
    var fc;

    $scope.priceSensitivity = [
      {
        value: 0.5,
        name: '0.5%'
      },
      {
        value: 1,
        name: '1%'
      },
      {
        value: 2,
        name: '2%'
      },
      {
        value: 5,
        name: '5%'
      },
      {
        value: 10,
        name: '10%'
      }
    ];
    $scope.selectedPriceSensitivity = $scope.priceSensitivity[1];

    var otherWallets = function(testnet) {
      var network = testnet ? 'testnet' : 'livenet';
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

    this.init = function(testnet) {
      self.otherWallets = otherWallets(testnet);
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

    this.getPaymentMethods = function(token) {
      coinbaseService.getPaymentMethods(token, function(err, p) {
        if (err) {
          self.error = err;
          return;
        }
        self.paymentMethods = [];
        lodash.each(p.data, function(pm) {
          if (pm.allow_sell) {
            self.paymentMethods.push(pm);
          }
          if (pm.allow_sell && pm.primary_sell) {
            $scope.selectedPaymentMethod = pm;
          }
        });
      });
    };

    this.getPrice = function(token) {
      var currency = 'USD';
      coinbaseService.sellPrice(token, currency, function(err, s) {
        if (err) return;
        self.sellPrice = s.data || null;
      });
    };

    $scope.openWalletsModal = function(wallets) {
      self.error = null;
      self.selectedWalletId = null;
      self.selectedWalletName = null;

      $scope.type = 'SELL';
      $scope.wallets = wallets;
      $scope.noColor = true;
      $scope.self = self;

      $ionicModal.fromTemplateUrl('views/modals/wallets.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(modal) {
        $scope.walletsModal = modal;
        $scope.walletsModal.show();
      });
    };

    this.depositFunds = function(token, account) {
      self.error = null;
      if ($scope.amount) {
        this.createTx(token, account, $scope.amount)
      } else if ($scope.fiat) {
        var btcValue = ($scope.fiat / self.sellPrice.amount).toFixed(8);
        this.createTx(token, account, btcValue);
      }
    };

    this.sellRequest = function(token, account, ctx) {
      self.error = null;
      if (!ctx.amount) return;
      var accountId = account.id;
      var data = ctx.amount;
      data['payment_method'] = $scope.selectedPaymentMethod.id || null;
      this.loading = 'Sending request...';
      coinbaseService.sellRequest(token, accountId, data, function(err, sell) {
        self.loading = null;
        if (err) {
          self.error = err;
          return;
        }
        self.sellInfo = sell.data;
      });
    };

    this.confirmSell = function(token, account, sell) {
      self.error = null;
      var accountId = account.id;
      var sellId = sell.id;
      this.loading = 'Selling bitcoin...';
      coinbaseService.sellCommit(token, accountId, sellId, function(err, data) {
        self.loading = null;
        if (err) {
          self.error = err;
          return;
        }
        self.success = data.data;
        $scope.$emit('Local/CoinbaseTx');
      });
    };

    this.createTx = function(token, account, amount) {
      self.error = null;

      var accountId = account.id;
      var dataSrc = {
        name: 'Received from Copay: ' + self.selectedWalletName
      };
      var outputs = [];
      var config = configService.getSync();
      var configWallet = config.wallet;
      var walletSettings = configWallet.settings;


      self.loading = 'Creating transaction...';
      $timeout(function() {

        coinbaseService.createAddress(token, accountId, dataSrc, function(err, data) {
          if (err) {
            self.loading = null;
            self.error = err;
            return;
          }

          var address, comment;

          address = data.data.address;
          amount = parseInt((amount * 100000000).toFixed(0));
          comment = 'Send funds to Coinbase Account: ' + account.name;

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

          walletService.createTx(fc, txp, function(err, createdTxp) {
            if (err) {
              $log.debug(err);
              self.loading = null;
              self.error = {
                errors: [{
                  message: 'Could not create transaction: ' + err.message
                }]
              };
              $scope.$apply();
              return;
            }
            $scope.$emit('Local/NeedsConfirmation', createdTxp, function(accept) {
              self.loading = null;
              if (accept) {
                self.confirmTx(createdTxp, function(err, tx) {
                  if (err) {
                    self.error = {
                      errors: [{
                        message: 'Could not create transaction: ' + err.message
                      }]
                    };
                    return;
                  }
                  self.loading = 'Checking transaction...';
                  coinbaseService.getTransactions(token, accountId, function(err, ctxs) {
                    if (err) {
                      $log.debug(err);
                      return;
                    }
                    lodash.each(ctxs.data, function(ctx) {
                      if (ctx.type == 'send' && ctx.from) {
                        if (ctx.status == 'completed') {
                          self.sellRequest(token, account, ctx);
                        } else {
                          // Save to localstorage
                          self.loading = null;
                          ctx['price_sensitivity'] = $scope.selectedPriceSensitivity;
                          ctx['sell_price_amount'] = self.sellPrice.amount;
                          ctx['sell_price_currency'] = self.sellPrice.currency;
                          ctx['description'] = 'Copay Wallet: ' + fc.credentials.walletName;
                          coinbaseService.savePendingTransaction(ctx, null, function(err) {
                            if (err) $log.debug(err);
                            self.sendInfo = ctx;
                            $timeout(function() {
                              $scope.$emit('Local/CoinbaseTx');
                            }, 1000);
                          });
                        }
                        return false;
                      }
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
            return cb(err);
          }

          self.loading = 'Sending bitcoin to Coinbase...';
          walletService.publishTx(fc, txp, function(err, publishedTxp) {
            if (err) {
              self.loading = null;
              $log.debug(err);
              return cb({
                errors: [{
                  message: 'Transaction could not be published: ' + err.message
                }]
              });
            }

            walletService.signTx(fc, publishedTxp, function(err, signedTxp) {
              walletService.lock(fc);
              if (err) {
                self.loading = null;
                $log.debug(err);
                walletService.removeTx(fc, signedTxp, function(err) {
                  if (err) $log.debug(err);
                });
                return cb({
                  errors: [{
                    message: 'The payment was created but could not be completed: ' + err.message
                  }]
                });
              }

              walletService.broadcastTx(fc, signedTxp, function(err, broadcastedTxp) {
                if (err) {
                  self.loading = null;
                  $log.debug(err);
                  walletService.removeTx(fc, broadcastedTxp, function(err) {
                    if (err) $log.debug(err);
                  });
                  return cb({
                    errors: [{
                      message: 'The payment was created but could not be broadcasted: ' + err.message
                    }]
                  });
                }
                $timeout(function() {
                  self.loading = null;
                  return cb(null, broadcastedTxp);
                }, 5000);
              });
            });
          });
        });
      });
    };

  });
