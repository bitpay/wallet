'use strict';

angular.module('copayApp.controllers').controller('buyCoinbaseController', function($scope, $log, $state, $timeout, $ionicHistory, lodash, coinbaseService, popupService, profileService, ongoingProcess, walletService) {

  var amount;
  var currency;

  var initError = function(err) {
    $log.error(err);
    popupService.showAlert('Error', 'Could not connect to Coinbase', function() {
      $ionicHistory.goBack();
    });
  };

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    amount = data.stateParams.amount;
    currency = data.stateParams.currency;

    if (amount < 1) {
      popupService.showAlert('Error', 'Amount must be at least 1.00 ' + currency, function() {
        $ionicHistory.goBack();
      });
      return;
    }
    
    $scope.network = coinbaseService.getNetwork();
    $scope.wallets = profileService.getWallets({
      onlyComplete: true,
      network: $scope.network
    });
    $scope.wallet = $scope.wallets[0]; // Default first wallet

    ongoingProcess.set('connectingCoinbase', true);
    coinbaseService.init(function(err, res) {
      if (err) {
        ongoingProcess.set('connectingCoinbase', false);
        initError(err);
        return;
      }
      var accessToken = res.accessToken;

      $scope.paymentMethods = [];
      $scope.selectedPaymentMethodId = { value : null };
      coinbaseService.getPaymentMethods(accessToken, function(err, p) {
        if (err) {
          ongoingProcess.set('connectingCoinbase', false);
          initError(err);
          return;
        }
        lodash.each(p.data, function(pm) {
          if (pm.allow_buy) {
            $scope.paymentMethods.push(pm);
          }
          if (pm.allow_buy && pm.primary_buy) {
            $scope.selectedPaymentMethodId.value = pm.id;
            $scope.buyRequest();
          }
        });
      });
    });
  });

  $scope.buyRequest = function() {
    ongoingProcess.set('connectingCoinbase', true);
    coinbaseService.init(function(err, res) {
      if (err) {
        ongoingProcess.set('connectingCoinbase', false);
        initError(err);
        return;
      }
      var accessToken = res.accessToken;
      var accountId = res.accountId;
      var dataSrc = {
        amount: amount,
        currency: currency,
        payment_method: $scope.selectedPaymentMethodId.value
      };
      coinbaseService.buyRequest(accessToken, accountId, dataSrc, function(err, data) {
        ongoingProcess.set('connectingCoinbase', false);
        if (err) {
          $log.error(err);
          popupService.showAlert('Error', 'Could not create a buy request', function() {
            $ionicHistory.goBack();
          });
          return;
        }
        $scope.buyRequestInfo = data.data;
      });
    });
  };

  $scope.buyConfirm = function() {
    var message = 'Buy bitcoin for ' + amount + ' ' + currency;
    var okText = 'Confirm';
    var cancelText = 'Cancel';
    popupService.showConfirm(null, message, okText, cancelText, function(ok) {
      if (!ok) return;
        
      ongoingProcess.set('buyingBitcoin', true);
      coinbaseService.init(function(err, res) {
        if (err) {
          ongoingProcess.set('buyingBitcoin', false);
          initError(err);
          return;
        }
        var accessToken = res.accessToken;
        var accountId = res.accountId;
        coinbaseService.buyCommit(accessToken, accountId, $scope.buyRequestInfo.id, function(err, b) {
          if (err) {
            ongoingProcess.set('buyingBitcoin', false);
            popupService.showAlert('Error', 'Could not complete purchase');
            return;
          }
          var tx = b.data.transaction;
          if (!tx) {
            ongoingProcess.set('buyingBitcoin', false);
            popupService.showAlert('Error', 'Transaction not found');
            return;
          }

          $timeout(function() {
            coinbaseService.getTransaction(accessToken, accountId, tx.id, function(err, updatedTx) {
              if (err) {
                ongoingProcess.set('buyingBitcoin', false);
                popupService.showAlert('Error', 'Transaction error');
                return;
              }
              walletService.getAddress($scope.wallet, false, function(err, walletAddr) {
                if (err) {
                  ongoingProcess.set('buyingBitcoin', false);
                  popupService.showAlert('Error', err);
                  return;
                }
                updatedTx.data['toAddr'] = walletAddr;
                updatedTx.data['status'] = 'pending'; // Forcing "pending" status to process later

                $log.debug('Saving transaction to process later...');
                coinbaseService.savePendingTransaction(updatedTx.data, {}, function(err) {
                  if (err) $log.debug(err);
                  ongoingProcess.set('buyingBitcoin', false);
                  $scope.buySuccess = updatedTx.data;
                  $timeout(function() {
                    $scope.$apply();
                  });
                });
              });
            });
          }, 8000);
        });
      });
    });
  };

  $scope.showWalletSelector = function() {
    $scope.walletSelectorTitle = ($scope.action) == 'buy' ? 'Receive in' : 'Sell From';
    $scope.showWallets = true;
  };

  $scope.onWalletSelect = function(wallet) {
    $scope.wallet = wallet;
  };

  $scope.goBackHome = function() {
    $ionicHistory.nextViewOptions({
      disableAnimate: true,
      historyRoot: true
    });
    $ionicHistory.clearHistory();
    $state.go('tabs.home').then(function() {
      $state.transitionTo('tabs.buyandsell.coinbase');
    });
  };
});
