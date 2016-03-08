'use strict';

angular.module('copayApp.controllers').controller('sendCoinbaseController', 
  function($scope, $modal, $log, $timeout, lodash, profileService, coinbaseService, animationService, txService, bwsError, addressService) {
    
    var self = this;
    window.ignoreMobilePause = true;


    var otherWallets = function(testnet) {
      var network = testnet ? 'testnet' : 'livenet';
      return lodash.filter(profileService.getWallets(network), function(w) {
        return w.network == network;
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
        $scope.type = 'SEND';
        $scope.wallets = wallets;
        $scope.noColor = true;
        $scope.cancel = function() {
          $modalInstance.dismiss('cancel');
        };

        $scope.selectWallet = function(walletId, walletName) {
          if (!profileService.getClient(walletId).isComplete()) {
            self.error = bwsError.msg({'code': 'WALLET_NOT_COMPLETE'}, 'Could not choose the wallet');
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
          $scope.$apply();
        }, 100);
      });
    };

    self.send = function(token, account) {
      self.error = null;

      var accountId = account.id;
      self.loading = 'Sending bitcoin...';
      $timeout(function() {
        addressService.getAddress(self.selectedWalletId, false, function(err, walletAddr) {
          if (err) {
            self.loading = null;
            self.error = {errors: [{ message: 'Could not create address' }]};
            return;
          }
          var data = {
            to: walletAddr,
            amount: $scope.amount,
            currency: 'BTC',
            description: 'To Copay Wallet: ' + self.selectedWalletName
          };
          coinbaseService.sendTo(token, accountId, data, function(err, data) {
            self.loading = null;
            if (err) {
              self.error = err;
            }
            else {
              self.success = data.data;
              $timeout(function() {
                $scope.$emit('Local/CoinbaseTx');
              }, 2000);
            }
          });
        });
      }, 100);
    };

  });
