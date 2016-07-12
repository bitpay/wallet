'use strict';

angular.module('copayApp.controllers').controller('sellCoinbaseController',
  function($rootScope, $scope, $log, $timeout, $ionicModal, lodash, profileService, coinbaseService, configService, walletService, fingerprintService, ongoingProcess, go) {

    var self = this;
    var client;

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

    var handleEncryptedWallet = function(client, cb) {
      if (!walletService.isEncrypted(client)) return cb();
      $rootScope.$emit('Local/NeedsPassword', false, function(err, password) {
        if (err) return cb(err);
        return cb(walletService.unlock(client, password));
      });
    };

    this.init = function(testnet) {
      self.allWallets = profileService.getWallets(testnet ? 'testnet' : 'livenet', 1);

      client = profileService.focusedClient;
      if (client && client.credentials.m == 1) {
        $timeout(function() {
          self.selectedWalletId = client.credentials.walletId;
          self.selectedWalletName = client.credentials.walletName;
          $scope.$apply();
        }, 100);
      }
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

      $scope.$on('walletSelected', function(ev, walletId) {
        $timeout(function() {
          client = profileService.getClient(walletId);
          self.selectedWalletId = walletId;
          self.selectedWalletName = client.credentials.walletName;
          $scope.$apply();
        }, 100);
        $scope.walletsModal.hide();
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
      ongoingProcess.set('Sending request...', true);
      coinbaseService.sellRequest(token, accountId, data, function(err, sell) {
        ongoingProcess.set('Sending request...', false);
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
      ongoingProcess.set('Selling Bitcoin...', true);
      coinbaseService.sellCommit(token, accountId, sellId, function(err, data) {
        ongoingProcess.set('Selling Bitcoin...', false);
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

      if (!client) {
        self.error = 'No wallet selected';
        return;
      }

      var accountId = account.id;
      var dataSrc = {
        name: 'Received from Copay: ' + self.selectedWalletName
      };
      var outputs = [];
      var config = configService.getSync();
      var configWallet = config.wallet;
      var walletSettings = configWallet.settings;


      ongoingProcess.set('Creating Transaction...', true);
      $timeout(function() {

        coinbaseService.createAddress(token, accountId, dataSrc, function(err, data) {
          if (err) {
            ongoingProcess.set('Creating Transaction...', false);
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

          walletService.createTx(client, txp, function(err, createdTxp) {
            if (err) {
              $log.debug(err);
              ongoingProcess.set('Creating Transaction...', false);
              self.error = {
                errors: [{
                  message: 'Could not create transaction: ' + err.message
                }]
              };
              $scope.$apply();
              return;
            }
            ongoingProcess.set('Creating Transaction...', false);
            $scope.$emit('Local/NeedsConfirmation', createdTxp, function(accept) {
              if (accept) {
                self.confirmTx(createdTxp, function(err, tx) {
                  ongoingProcess.clear();
                  if (err) {
                    self.error = {
                      errors: [{
                        message: 'Could not create transaction: ' + err.message
                      }]
                    };
                    return;
                  }
                  ongoingProcess.set('Checking Transaction...', false);
                  coinbaseService.getTransactions(token, accountId, function(err, ctxs) {
                    if (err) {
                      $log.debug(err);
                      return;
                    }
                    lodash.each(ctxs.data, function(ctx) {
                      if (ctx.type == 'send' && ctx.from) {
                        ongoingProcess.clear();
                        if (ctx.status == 'completed') {
                          self.sellRequest(token, account, ctx);
                        } else {
                          // Save to localstorage
                          ctx['price_sensitivity'] = $scope.selectedPriceSensitivity;
                          ctx['sell_price_amount'] = self.sellPrice ? self.sellPrice.amount : '';
                          ctx['sell_price_currency'] = self.sellPrice ? self.sellPrice.currency : 'USD';
                          ctx['description'] = 'Copay Wallet: ' + client.credentials.walletName;
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
              } else {
                go.path('coinbase');
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
            return cb(err);
          }

          ongoingProcess.set('Sending Bitcoin to Coinbase...', true);
          walletService.publishTx(client, txp, function(err, publishedTxp) {
            if (err) {
              ongoingProcess.set('Sending Bitcoin to Coinbase...', false);
              $log.debug(err);
              return cb({
                errors: [{
                  message: 'Transaction could not be published: ' + err.message
                }]
              });
            }

            walletService.signTx(client, publishedTxp, function(err, signedTxp) {
              walletService.lock(client);
              if (err) {
                ongoingProcess.set('Sending Bitcoin to Coinbase...', false);
                $log.debug(err);
                walletService.removeTx(client, signedTxp, function(err) {
                  if (err) $log.debug(err);
                });
                return cb({
                  errors: [{
                    message: 'The payment was created but could not be completed: ' + err.message
                  }]
                });
              }

              walletService.broadcastTx(client, signedTxp, function(err, broadcastedTxp) {
                if (err) {
                  ongoingProcess.set('Sending Bitcoin to Coinbase...', false);
                  $log.debug(err);
                  walletService.removeTx(client, broadcastedTxp, function(err) {
                    if (err) $log.debug(err);
                  });
                  return cb({
                    errors: [{
                      message: 'The payment was created but could not be broadcasted: ' + err.message
                    }]
                  });
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
