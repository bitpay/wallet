'use strict';

angular.module('copayApp.controllers').controller('sellCoinbaseController', 
  function($scope, $modal, $log, $timeout, lodash, profileService, coinbaseService, animationService, bwsError, configService, walletService, fingerprintService) {
    
    window.ignoreMobilePause = true;
    var self = this;
    var fc;

    $scope.priceSensitivity = [
      {
        value : 0.5,
        name: '0.5%'
      },
      {
        value : 1,
        name: '1%'
      },
      {
        value : 2,
        name: '2%'
      },
      {
        value : 5,
        name: '5%'
      },
      {
        value : 10,
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
      var ModalInstanceCtrl = function($scope, $modalInstance) {
        $scope.type = 'SELL';
        $scope.wallets = wallets;
        $scope.noColor = true;
        $scope.cancel = function() {
          $modalInstance.dismiss('cancel');
        };

        $scope.selectWallet = function(walletId, walletName) {
          if (!profileService.getClient(walletId).isComplete()) {
            self.error = bwsError.msg({
              'code': 'WALLET_NOT_COMPLETE'
            }, 'Could not choose the wallet');
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
      var dataSrc = { name : 'Received from Copay: ' + self.selectedWalletName };
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

          walletService.createTx(txp, fc, function(err, createdTxp) {
            if (err) {
              $log.debug(err);
              self.loading = null;
              self.error = {errors: [{ message: 'Could not create transaction: ' + err.message }]};
              $scope.$apply();
              return;
            }
            $scope.$emit('Local/NeedsConfirmation', createdTxp, function(accept) {
              self.loading = null;
              if (accept) { 
                self.confirmTx(createdTxp, function(err, tx) {
                  if (err) { 
                    self.error = {errors: [{ message: 'Could not create transaction: ' + err.message }]};
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
      var config = configService.getSync();

      fingerprintService.check(fc, config, function(err) {
        if (err) {
          $log.debug(err);
          return cb(err);
        }

        profileService.unlockFC(fc, function(err) {
          if (err) {
            $log.debug(err);
            return cb(err);
          }

          self.loading = 'Sending bitcoin to Coinbase...';
          walletService.publishTx(txp, fc, function(err, publishedTxp) {
            if (err) {
              self.loading = null;
              $log.debug(err);
              return cb({errors: [{ message: 'Transaction could not be published: ' + err.message }]});
            }

            walletService.signTx(publishedTxp, fc, function(err, signedTxp) {
              profileService.lockFC(fc);
              if (err) {
                self.loading = null;
                $log.debug(err);
                walletService.removeTx(signedTxp, fc, function(err) {
                  if (err) $log.debug(err);
                });
                return cb({errors: [{ message: 'The payment was created but could not be completed: ' + err.message }]});
              }

              walletService.broadcastTx(signedTxp, fc, function(err, broadcastedTxp) {
                if (err) {
                  self.loading = null;
                  $log.debug(err);
                  walletService.removeTx(broadcastedTxp, fc, function(err) {
                    if (err) $log.debug(err);
                  });
                  return cb({errors: [{ message: 'The payment was created but could not be broadcasted: ' + err.message }]});
                }
                $timeout(function() {
                  self.loading = null;
                  return cb(null, txp);
                }, 5000);
              });
            });
          });
        });
      });
    };

  });
