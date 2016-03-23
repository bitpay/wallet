'use strict';

angular.module('copayApp.controllers').controller('buyCoinbaseController', 
  function($scope, $modal, $log, $timeout, lodash, profileService, coinbaseService, animationService, txService, bwsError, addressService) {
    
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
      coinbaseService.buyPrice(token, function(err, b) {
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

    this.buyRequest = function(token, account) {
      var accountId = account.id;
      var amount = $scope.amount ? $scope.amount : $scope.fiat;
      var currency = $scope.amount ? 'BTC' : 'USD';
      if (!amount) return;
      var dataSrc = {
        amount: amount,
        currency: currency
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
            self.loading = null;
            if (err) $log.debug(err);
            if (updatedTx.data.status == 'completed') {
              // Send btc from coinbase to copay
              self.receiveFromCoinbase(token, account, updatedTx.data);
            } else {
              coinbaseService.savePendingTransaction(updatedTx.data, null, function(err) {
                if (err) $log.debug(err);
                self.success = updatedTx.data;
                $timeout(function() {
                  $scope.$emit('Local/CoinbaseTx');
                }, 1000);
              });
            }
          });
        }
      });
    };

    this.receiveFromCoinbase = function(token, account, tx) {
      self.error = null;
      var accountId = account.id;

      self.loading = 'Sending funds to Copay...';
      addressService.getAddress(self.selectedWalletId, false, function(err, addr) {
        if (err) { 
          self.loading = null;
          self.error = {errors: [{ message: 'Could not create address' }]};
          return;
        }
        var data = {
          to: addr,
          amount: tx.amount.amount,
          currency: tx.amount.currency,
          description: 'To Copay Wallet: ' + self.selectedWalletName
        };
        coinbaseService.sendTo(token, accountId, data, function(err, res) {
          self.loading = null;
          if (err) {
            self.error = err;
          } else {
            self.receiveInfo = res.data;
            $timeout(function() {
              $scope.$emit('Local/CoinbaseTx');
            }, 1000);
          }

        });
      });
      
    };


  });
