'use strict';

angular.module('copayApp.controllers').controller('buyCoinbaseController', function($scope, $log, $state, $timeout, $ionicHistory, $ionicScrollDelegate, $ionicConfig, lodash, coinbaseService, popupService, profileService, ongoingProcess, walletService, txFormatService) {

  var amount;
  var currency;

  var showErrorAndBack = function(err) {
    $scope.sendStatus = '';
    $log.error(err);
    err = err.errors ? err.errors[0].message : err;
    popupService.showAlert('Error', err, function() {
      $ionicHistory.goBack();
    });
  };

  var showError = function(err) {
    $scope.sendStatus = '';
    $log.error(err);
    err = err.errors ? err.errors[0].message : err;
    popupService.showAlert('Error', err);
  };

  var statusChangeHandler = function (processName, showName, isOn) {
    $log.debug('statusChangeHandler: ', processName, showName, isOn);
    if ( processName == 'buyingBitcoin' && !isOn) {
      $scope.sendStatus = 'success';
      $timeout(function() {
        $scope.$digest();
      }, 100);
    } else if (showName) {
      $scope.sendStatus = showName;
    }
  };

  $scope.$on("$ionicView.beforeLeave", function(event, data) {
    $ionicConfig.views.swipeBackEnabled(true);
  });

  $scope.$on("$ionicView.enter", function(event, data) {
    $ionicConfig.views.swipeBackEnabled(false);
  });

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    $scope.isFiat = data.stateParams.currency != 'μNAV' && data.stateParams.currency != 'NAV' ? true : false;
    var parsedAmount = txFormatService.parseAmount(
      data.stateParams.amount,
      data.stateParams.currency);

    // Buy always in BTC
    amount = (parsedAmount.amountSat / 100000000).toFixed(8);
    currency = 'NAV';

    $scope.amountUnitStr = parsedAmount.amountUnitStr;

    ongoingProcess.set('calculatingFee', true);
    coinbaseService.checkEnoughFundsForFee(amount, function(err) {
      ongoingProcess.set('calculatingFee', false);
      if (err) {
        showErrorAndBack(err);
        return;
      }

      $scope.network = coinbaseService.getNetwork();
      $scope.wallets = profileService.getWallets({
        onlyComplete: true,
        network: $scope.network
      });

      if (lodash.isEmpty($scope.wallets)) {
        showErrorAndBack('No wallets available');
        return;
      }
      $scope.wallet = $scope.wallets[0]; // Default first wallet

      ongoingProcess.set('connectingCoinbase', true);
      coinbaseService.init(function(err, res) {
        if (err) {
          ongoingProcess.set('connectingCoinbase', false);
          showErrorAndBack(err);
          return;
        }
        var accessToken = res.accessToken;

        coinbaseService.buyPrice(accessToken, coinbaseService.getAvailableCurrency(), function(err, b) {
          $scope.buyPrice = b.data || null;
        });

        $scope.paymentMethods = [];
        $scope.selectedPaymentMethodId = { value : null };
        coinbaseService.getPaymentMethods(accessToken, function(err, p) {
          if (err) {
            ongoingProcess.set('connectingCoinbase', false);
            showErrorAndBack(err);
            return;
          }

          var hasPrimary;
          var pm;
          for(var i = 0; i < p.data.length; i++) {
            pm = p.data[i];
            if (pm.allow_buy) {
              $scope.paymentMethods.push(pm);
            }
            if (pm.allow_buy && pm.primary_buy) {
              hasPrimary = true;
              $scope.selectedPaymentMethodId.value = pm.id;
            }
          }
          if (lodash.isEmpty($scope.paymentMethods)) {
            ongoingProcess.set('connectingCoinbase', false);
            showErrorAndBack('No payment method available to buy');
            return;
          }
          if (!hasPrimary) $scope.selectedPaymentMethodId.value = $scope.paymentMethods[0].id;
          $scope.buyRequest();
        });
      });
    });
  });

  $scope.buyRequest = function() {
    ongoingProcess.set('connectingCoinbase', true);
    coinbaseService.init(function(err, res) {
      if (err) {
        ongoingProcess.set('connectingCoinbase', false);
        showErrorAndBack(err);
        return;
      }
      var accessToken = res.accessToken;
      var accountId = res.accountId;
      var dataSrc = {
        amount: amount,
        currency: currency,
        payment_method: $scope.selectedPaymentMethodId.value,
        quote: true
      };
      coinbaseService.buyRequest(accessToken, accountId, dataSrc, function(err, data) {
        ongoingProcess.set('connectingCoinbase', false);
        if (err) {
          showErrorAndBack(err);
          return;
        }
        $scope.buyRequestInfo = data.data;
        $timeout(function() {
          $scope.$apply();
        }, 100);
      });
    });
  };

  $scope.buyConfirm = function() {
    var message = 'Buy Nav Coin for ' + $scope.amountUnitStr;
    var okText = 'Confirm';
    var cancelText = 'Cancel';
    popupService.showConfirm(null, message, okText, cancelText, function(ok) {
      if (!ok) return;

      ongoingProcess.set('buyingBitcoin', true, statusChangeHandler);
      coinbaseService.init(function(err, res) {
        if (err) {
          ongoingProcess.set('buyingBitcoin', false, statusChangeHandler);
          showError(err);
          return;
        }
        var accessToken = res.accessToken;
        var accountId = res.accountId;
        var dataSrc = {
          amount: amount,
          currency: currency,
          payment_method: $scope.selectedPaymentMethodId.value,
          commit: true
        };
        coinbaseService.buyRequest(accessToken, accountId, dataSrc, function(err, b) {
          if (err) {
            ongoingProcess.set('buyingBitcoin', false, statusChangeHandler);
            showError(err);
            return;
          }

          var processBuyTx = function (tx) {
            if (!tx) {
              ongoingProcess.set('buyingBitcoin', false, statusChangeHandler);
              showError('Transaction not found');
              return;
            }

            coinbaseService.getTransaction(accessToken, accountId, tx.id, function(err, updatedTx) {
              if (err) {
                ongoingProcess.set('buyingBitcoin', false, statusChangeHandler);
                showError(err);
                return;
              }
              walletService.getAddress($scope.wallet, false, function(err, walletAddr) {
                if (err) {
                  ongoingProcess.set('buyingBitcoin', false, statusChangeHandler);
                  showError(err);
                  return;
                }
                updatedTx.data['toAddr'] = walletAddr;
                updatedTx.data['status'] = 'pending'; // Forcing "pending" status to process later

                $log.debug('Saving transaction to process later...');
                coinbaseService.savePendingTransaction(updatedTx.data, {}, function(err) {
                  ongoingProcess.set('buyingBitcoin', false, statusChangeHandler);
                  if (err) $log.debug(err);
                });
              });
            });
          };

          $timeout(function() {
            var tx = b.data ? b.data.transaction : null;
            if (tx) {
              processBuyTx(tx);
            }
            else {
              coinbaseService.getBuyOrder(accessToken, accountId, b.data.id, function (err, buyResp) {
                if (err) {
                  ongoingProcess.set('buyingBitcoin', false, statusChangeHandler);
                  showError(err);
                  return;
                }
                var tx = buyResp.data ? buyResp.data.transaction : null;
                processBuyTx(tx);
              });
            }
          }, 8000);
        });
      });
    });
  };

  $scope.showWalletSelector = function() {
    $scope.walletSelectorTitle = 'Receive in';
    $scope.showWallets = true;
  };

  $scope.onWalletSelect = function(wallet) {
    $scope.wallet = wallet;
  };

  $scope.goBackHome = function() {
    $scope.sendStatus = '';
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
