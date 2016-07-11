'use strict';

angular.module('copayApp.controllers').controller('buyCoinbaseController',
  function($scope, $log, $ionicModal, $timeout, lodash, profileService, coinbaseService, addressService, ongoingProcess) {
    var self = this;

    this.init = function(testnet) {
      self.allWallets = profileService.getWallets(testnet ? 'testnet' : 'livenet');

      var client = profileService.focusedClient;
      if (client) {
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
          if (pm.allow_buy) {
            self.paymentMethods.push(pm);
          }
          if (pm.allow_buy && pm.primary_buy) {
            $scope.selectedPaymentMethod = pm;
          }
        });
      });
    };

    this.getPrice = function(token) {
      var currency = 'USD';
      coinbaseService.buyPrice(token, currency, function(err, b) {
        if (err) return;
        self.buyPrice = b.data || null;
      });
    };

    $scope.openWalletsModal = function(wallets) {
      self.error = null;

      $scope.type = 'BUY';
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
          var client = profileService.getClient(walletId);
          self.selectedWalletId = walletId;
          self.selectedWalletName = client.credentials.walletName;
          $scope.$apply();
        }, 100);
        $scope.walletsModal.hide();
      });
    };

    this.buyRequest = function(token, account) {
      self.error = null;
      var accountId = account.id;
      var amount = $scope.amount ? $scope.amount : $scope.fiat;
      var currency = $scope.amount ? 'BTC' : 'USD';
      if (!amount) return;
      var dataSrc = {
        amount: amount,
        currency: currency,
        payment_method: $scope.selectedPaymentMethod.id || null
      };
      ongoingProcess.set('Sending request...', true);
      coinbaseService.buyRequest(token, accountId, dataSrc, function(err, data) {
        ongoingProcess.set('Sending request...', false);
        if (err) {
          self.error = err;
          return;
        }
        self.buyInfo = data.data;
      });
    };

    this.confirmBuy = function(token, account, buy) {
      self.error = null;
      var accountId = account.id;
      var buyId = buy.id;
      ongoingProcess.set('Buying Bitcoin...', true);
      coinbaseService.buyCommit(token, accountId, buyId, function(err, b) {
        ongoingProcess.set('Buying Bitcoin...', false);
        if (err) {
          self.error = err;
          return;
        } else {
          var tx = b.data.transaction;
          if (!tx) return;

          ongoingProcess.set('Fetching transaction...', true);
          coinbaseService.getTransaction(token, accountId, tx.id, function(err, updatedTx) {
            ongoingProcess.set('Fetching transaction...', false);
            if (err) $log.debug(err);
            addressService.getAddress(self.selectedWalletId, false, function(err, addr) {
              if (err) {
                self.error = {
                  errors: [{
                    message: 'Could not create address'
                  }]
                };
                return;
              }
              updatedTx.data['toAddr'] = addr;
              coinbaseService.savePendingTransaction(updatedTx.data, {}, function(err) {
                if (err) $log.debug(err);
                if (updatedTx.data.status == 'completed') {
                  self.sendToCopay(token, account, updatedTx.data);
                } else {
                  self.success = updatedTx.data;
                  $timeout(function() {
                    $scope.$emit('Local/CoinbaseTx');
                  }, 1000);
                }
              });
            });
          });
        }
      });
    };

    this.sendToCopay = function(token, account, tx) {
      self.error = null;
      var accountId = account.id;

      ongoingProcess.set('Sending funds to Copay...', true);
      var data = {
        to: tx.toAddr,
        amount: tx.amount.amount,
        currency: tx.amount.currency,
        description: 'Copay Wallet: ' + self.selectedWalletName
      };
      coinbaseService.sendTo(token, accountId, data, function(err, res) {
        ongoingProcess.set('Sending funds to Copay...', false);
        if (err) {
          self.error = err;
        } else {
          self.receiveInfo = res.data;
          if (!res.data.id) return;
          coinbaseService.getTransaction(token, accountId, res.data.id, function(err, sendTx) {
            coinbaseService.savePendingTransaction(tx, {
              remove: true
            }, function(err) {
              coinbaseService.savePendingTransaction(sendTx.data, {}, function(err) {
                $timeout(function() {
                  $scope.$emit('Local/CoinbaseTx');
                }, 1000);
              });
            });
          });
        }

      });
    };


  });
