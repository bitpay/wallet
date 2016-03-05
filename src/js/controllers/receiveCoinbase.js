'use strict';

angular.module('copayApp.controllers').controller('receiveCoinbaseController', 
  function($scope, $modal, $log, $timeout, lodash, profileService, configService, coinbaseService, animationService, txService, bwsError, addressService) {
    
    var fc;
    var config = configService.getSync();
    this.currentSpendUnconfirmed = config.wallet.spendUnconfirmed;
    window.ignoreMobilePause = true;


    var otherWallets = function(testnet) {
      var network = testnet ? 'testnet' : 'livenet';
      return lodash.filter(profileService.getWallets(network), function(w) {
        return w.network == network;
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
        $scope.type = 'BUY';
        $scope.wallets = wallets;
        $scope.noColor = true;
        $scope.cancel = function() {
          $modalInstance.dismiss('cancel');
        };

        $scope.selectWallet = function(walletId, walletName) {
          if (!profileService.getClient(walletId).isComplete()) {
            this.error = bwsError.msg({'code': 'WALLET_NOT_COMPLETE'}, 'Could not choose the wallet');
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
          $scope.$apply();
        }, 100);
      });
    };

    this.receive = function(token, account) {
      var self = this;
      self.error = null;

      var accountId = account.id;
      self.loading = 'Receiving bitcoin...';
      $timeout(function() {
        addressService.getAddress(self.selectedWalletId, false, function(err, walletAddr) {
          if (err) {
            self.error = bwsError.cb(err, 'Could not create address');
            return;
          }
          var data = {
            to: walletAddr,
            amount: $scope.amount,
            currency: 'BTC',
            description: 'Send to Copay'
          };
          coinbaseService.sendTo(token, accountId, data, function(err, data) {
            self.loading = null;
            if (err) {
              self.error = err;
            }
            else {
              self.success = data.data;
              $scope.$emit('Local/CoinbaseTx');
            }
          });
        });
      }, 100);
    };

  });
