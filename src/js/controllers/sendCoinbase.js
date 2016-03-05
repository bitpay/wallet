'use strict';

angular.module('copayApp.controllers').controller('sendCoinbaseController', 
  function($scope, $modal, $log, $timeout, lodash, profileService, configService, coinbaseService, animationService, txService, bwsError) {
    
    var fc;
    var config = configService.getSync();
    window.ignoreMobilePause = true;


    var otherWallets = function(testnet) {
      var network = testnet ? 'testnet' : 'livenet';
      return lodash.filter(profileService.getWallets(network), function(w) {
        return w.network == network && w.m == 1;
      });
    };

    this.init = function(testnet) {
      var self = this;
      this.otherWallets = otherWallets(testnet);
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
      this.error = null;
      this.selectedWalletId = null;
      this.selectedWalletName = null;
      var ModalInstanceCtrl = function($scope, $modalInstance) {
        $scope.type = 'SELL';
        $scope.wallets = wallets;
        $scope.noColor = true;
        $scope.cancel = function() {
          $modalInstance.dismiss('cancel');
        };

        $scope.selectWallet = function(walletId, walletName) {
          if (!profileService.getClient(walletId).isComplete()) {
            this.error = bwsError.msg({
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
        var self = this;
        $timeout(function() {
          self.selectedWalletId = obj.walletId;
          self.selectedWalletName = obj.walletName;
          fc = profileService.getClient(obj.walletId);
          $scope.$apply();
        }, 100);
      });
    };

    this.createTx = function(token, account) {
      var self = this;
      self.error = null;

      var accountId = account.id;
      var dataSrc = { name : 'Receive from Copay' };
      var outputs = [];


      self.loading = 'Creating transaction...';
      $timeout(function() {

        coinbaseService.createAddress(token, accountId, dataSrc, function(err, data) {
          if (err) {
            self.loading = null;
            self.error = 'Could not get the destination bitcoin address';
            return;
          }

          var address, amount, comment;

          address = data.data.address;
          amount = parseInt(($scope.amount * 100000000).toFixed(0));
          comment = 'Send Bitcoin to Coinbase Account';

          outputs.push({
            'toAddress': address,
            'amount': amount,
            'message': comment
          });

          var opts = {
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
              self.error = 'Could not create transaction';
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

    this.confirmTx = function(txp) {
      var self = this;
      txService.prepare(function(err) {
        if (err) {
          $log.debug(err);
          self.loading = null;
          self.error = err;
          $timeout(function() {
            $scope.$digest();
          }, 1);
          return;
        }
        self.loading = 'Sending transaction...';
        txService.publishTx(txp, function(err, txpPublished) {
          if (err) {
            $log.debug(err);
            self.loading = null;
            self.error = 'Transaction could not be published';
            $timeout(function() {
              $scope.$digest();
            }, 1);
            return;
          } else {
            txService.signAndBroadcast(txpPublished, {}, function(err, txp) {
              if (err) {
                self.loading = null;
                self.error = 'The payment was created but could not be completed. Please try again from home screen';
                $scope.$emit('Local/TxProposalAction');
                $timeout(function() {
                  $scope.$digest();
                }, 1);
              } else {
                self.loading = null;
                self.success = txp;
                $timeout(function() {
                  $scope.$emit('Local/CoinbaseTx');
                }, 2000);
              }
            });
          }
        });
      });
    };

  });
