'use strict';

angular.module('copayApp.controllers').controller('sellCoinbaseController', 
  function($scope, $modal, $log, $timeout, lodash, profileService, coinbaseService, animationService, txService, bwsError) {
    
    window.ignoreMobilePause = true;
    var self = this;
    var fc;

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

    this.getPrice = function(token) {
      coinbaseService.sellPrice(token, function(err, s) {
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
      if ($scope.amount) {
        this.createTx(token, account, $scope.amount)
      } else if ($scope.fiat) {
        var btcValue = ($scope.fiat / self.sellPrice).fixed(8);
        this.createTx(token, account, btcValue);
      }
    };

    this.sellRequest = function(token, account, ctx) {
      var self = this;
      var accountId = account.id;
      var amount = ctx.amount;
      if (!amount) return;
      this.loading = 'Sending request...';
      coinbaseService.sellRequest(token, accountId, amount, function(err, data) {
        self.loading = null;
        if (err) {
          self.error = err;
          return;
        }
        self.sellInfo = data.data;
      });
    };

    this.confirmSell = function(token, account, sell) {
      var self = this;
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

          var opts = {
            selectedClient: fc,
            toAddress: address,
            amount: amount,
            outputs: outputs,
            message: comment,
            payProUrl: null
          };

          txService.createTx(opts, function(err, txp) {
            if (err) {
              $log.debug(err);
              self.loading = null;
              self.error = {errors: [{ message: 'Could not create transaction: ' + err.message }]};
              $scope.$apply();
              return;
            }
            $scope.$emit('Local/NeedsConfirmation', txp, function(accept) {
              self.loading = null;
              if (accept) { 
                self.confirmTx(txp, function(err, tx) {
                  if (err) { 
                    self.error = err;
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
                          coinbaseService.savePendingTransaction(ctx, null, function(err) {
                            if (err) $log.debug(err);
                            self.sendInfo = ctx;
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
      txService.prepare({selectedClient: fc}, function(err) {
        if (err) {
          $log.debug(err);
          return cb(err);
        }
        self.loading = 'Sending bitcoin to Coinbase...';
        txService.publishTx(txp, {selectedClient: fc}, function(err, txpPublished) {
          if (err) {
            self.loading = null;
            $log.debug(err);
            return cb({errors: [{ message: 'Transaction could not be published: ' + err.message }]});
          } else {
            txService.signAndBroadcast(txpPublished, {selectedClient: fc}, function(err, txp) {
              if (err) {
                self.loading = null;
                $log.debug(err);
                txService.removeTx(txp, function(err) {
                  if (err) $log.debug(err);
                });
                return cb({errors: [{ message: 'The payment was created but could not be completed: ' + err.message }]});
              } else {
                $timeout(function() {
                  self.loading = null;
                  return cb(null, txp);
                }, 5000);
              }
            });
          }
        });
      });
    };

  });
