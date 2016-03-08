'use strict';

angular.module('copayApp.controllers').controller('receiveCoinbaseController', 
  function($scope, $modal, $log, $timeout, lodash, profileService, coinbaseService, animationService, txService, bwsError) {
    
    var self = this;
    var fc;
    window.ignoreMobilePause = true;


    var otherWallets = function(testnet) {
      var network = testnet ? 'testnet' : 'livenet';
      return lodash.filter(profileService.getWallets(network), function(w) {
        return w.network == network && w.m == 1;
      });
    };

    self.init = function(testnet) {
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

    $scope.openWalletsModal = function(wallets) {
      self.error = null;
      var ModalInstanceCtrl = function($scope, $modalInstance) {
        $scope.type = 'RECEIVE';
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

    self.createTx = function(token, account) {
      self.error = null;

      var accountId = account.id;
      var dataSrc = { name : 'Copay: ' + self.selectedWalletName };
      var outputs = [];


      self.loading = 'Creating transaction...';
      $timeout(function() {

        coinbaseService.createAddress(token, accountId, dataSrc, function(err, data) {
          if (err) {
            self.loading = null;
            self.error = err;
            return;
          }

          var address, amount, comment;

          address = data.data.address;
          amount = parseInt(($scope.amount * 100000000).toFixed(0));
          comment = 'To Coinbase Account: ' + account.name;

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
              if (accept) self.confirmTx(txp);
              else {
                self.loading = null;
                return;
              }
            });
          });
        });
      }, 100);
    };

    self.confirmTx = function(txp) {
      self.error = null;
      txService.prepare({selectedClient: fc}, function(err) {
        if (err) {
          $log.debug(err);
          self.loading = null;
          self.error = err;
          $timeout(function() {
            $scope.$digest();
          }, 1);
          return;
        }
        self.loading = 'Receiving bitcoin...';
        txService.publishTx(txp, {selectedClient: fc}, function(err, txpPublished) {
          if (err) {
            $log.debug(err);
            self.loading = null;
            self.error = {errors: [{ message: 'Transaction could not be published: ' + err.message }]};
            $timeout(function() {
              $scope.$digest();
            }, 1);
            return;
          } else {
            txService.signAndBroadcast(txpPublished, {selectedClient: fc}, function(err, txp) {
              if (err) {
                self.loading = null;
                self.error = {errors: [{ message: 'The payment was created but could not be completed. Please try again from home screen: ' + err.message }]};
                $scope.$emit('Local/TxProposalAction');
                $timeout(function() {
                  $scope.$digest();
                }, 1);
              } else {
                self.loading = null;
                self.success = txp;
                $timeout(function() {
                  $scope.$emit('Local/CoinbaseTx');
                  $scope.$emit('Local/TxProposalAction', txp.status == 'broadcasted');
                }, 2000);
              }
            });
          }
        });
      });
    };

  });
