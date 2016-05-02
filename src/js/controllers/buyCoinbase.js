'use strict';

angular.module('copayApp.controllers').controller('buyCoinbaseController', 
  function($scope, $modal, $log, $timeout, lodash, profileService, coinbaseService, animationService, txService, bwsError, addressService, walletService) {
    
    window.ignoreMobilePause = true;
    var self = this;
    var fc;

    var otherWallets = function(testnet) {
      var network = testnet ? 'testnet' : 'livenet';
      return lodash.filter(profileService.getWallets(network), function(w) {
        return w.network == network;
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
      var ModalInstanceCtrl = function($scope, $modalInstance) {
        $scope.type = 'BUY';
        $scope.wallets = wallets;
        $scope.noColor = true;
        $scope.cancel = function() {
          $modalInstance.dismiss('cancel');
        };

        $scope.selectWallet = function(walletId, walletName) {
          walletService.isReady(walletId, function(err) {
            if (err) {
              self.error = {errors: [{ message: err }]};
              $modalInstance.dismiss('cancel');
            } else {
              $modalInstance.close({
                'walletId': walletId,
                'walletName': walletName,
              });
            }
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
      this.loading = 'Sending request...';
      coinbaseService.buyRequest(token, accountId, dataSrc, function(err, data) {
        self.loading = null;
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
      this.loading = 'Buying bitcoin...';
      coinbaseService.buyCommit(token, accountId, buyId, function(err, b) {
        self.loading = null;
        if (err) {
          self.error = err;
          return;
        } else {
          var tx = b.data.transaction;
          if (!tx) return;

          self.loading = 'Getting transaction...';
          coinbaseService.getTransaction(token, accountId, tx.id, function(err, updatedTx) {
            if (err) $log.debug(err);
            addressService.getAddress(self.selectedWalletId, false, function(err, addr) {
              if (err) { 
                self.loading = null;
                self.error = {errors: [{ message: 'Could not create address' }]};
                return;
              }
              updatedTx.data['toAddr'] = addr;
              coinbaseService.savePendingTransaction(updatedTx.data, {}, function(err) {
                self.loading = null;
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

      self.loading = 'Sending funds to Copay...';
      var data = {
        to: tx.toAddr,
        amount: tx.amount.amount,
        currency: tx.amount.currency,
        description: 'Copay Wallet: ' + self.selectedWalletName
      };
      coinbaseService.sendTo(token, accountId, data, function(err, res) {
        self.loading = null;
        if (err) {
          self.error = err;
        } else {
          self.receiveInfo = res.data;
          if (!res.data.id) return;
          coinbaseService.getTransaction(token, accountId, res.data.id, function(err, sendTx) {
            coinbaseService.savePendingTransaction(tx, {remove: true}, function(err) {
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
