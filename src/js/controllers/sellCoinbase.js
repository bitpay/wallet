'use strict';

angular.module('copayApp.controllers').controller('sellCoinbaseController', function($scope, $log, $state, $timeout, $ionicHistory, $ionicScrollDelegate, $ionicConfig, lodash, coinbaseService, popupService, profileService, ongoingProcess, walletService, appConfigService, configService, txFormatService, externalLinkService) {

  var coin = 'btc';
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

  var publishAndSign = function (wallet, txp, onSendStatusChange, cb) {
    if (!wallet.canSign() && !wallet.isPrivKeyExternal()) {
      var err = 'No signing proposal: No private key';
      $log.info(err);
      return cb(err);
    }

    walletService.publishAndSign(wallet, txp, function(err, txp) {
      if (err) return cb(err);
      return cb(null, txp);
    }, onSendStatusChange);
  };

  var processPaymentInfo = function() {
    ongoingProcess.set('connectingCoinbase', true);
    coinbaseService.init(function(err, res) {
      if (err) {
        ongoingProcess.set('connectingCoinbase', false);
        showErrorAndBack(coinbaseService.getErrorsAsString(err.errors));
        return;
      }
      var accessToken = res.accessToken;

      coinbaseService.sellPrice(accessToken, coinbaseService.getAvailableCurrency(), function(err, s) {
        $scope.sellPrice = s.data || null;
      });

      $scope.paymentMethods = [];
      $scope.selectedPaymentMethodId = { value : null };
      coinbaseService.getPaymentMethods(accessToken, function(err, p) {
        if (err) {
          ongoingProcess.set('connectingCoinbase', false);
          showErrorAndBack(coinbaseService.getErrorsAsString(err.errors));
          return;
        }
        var hasPrimary;
        var pm;
        for(var i = 0; i < p.data.length; i++) {
          pm = p.data[i];
          if (pm.allow_sell) {
            $scope.paymentMethods.push(pm);
          }
          if (pm.allow_sell && pm.primary_sell) {
            hasPrimary = true;
            $scope.selectedPaymentMethodId.value = pm.id;
          }
        }
        if (lodash.isEmpty($scope.paymentMethods)) {
          ongoingProcess.set('connectingCoinbase', false);
          var url = 'https://support.coinbase.com/customer/portal/articles/1148716-payment-methods-for-us-customers';
          var msg = 'No payment method available to sell';
          var okText = 'More info';
          var cancelText = 'Go Back';
          externalLinkService.open(url, true, null, msg, okText, cancelText, function() {
            $ionicHistory.goBack(-2);
          });
          return;
        }
        if (!hasPrimary) $scope.selectedPaymentMethodId.value = $scope.paymentMethods[0].id;
        $scope.sellRequest();
      });
    });
  };

  var checkTransaction = lodash.throttle(function(count, txp) {
    $log.warn('Check if transaction has been received by Coinbase. Try ' + count + '/5');
    // TX amount in BTC
    var satToBtc = 1 / 100000000;
    var amountBTC = (txp.amount * satToBtc).toFixed(8);
    coinbaseService.init(function(err, res) {
      if (err) {
        $log.error(err);
        checkTransaction(count, txp);
        return;
      }
      var accessToken = res.accessToken;
      var accountId = res.accountId;
      var sellPrice = null;

      coinbaseService.sellPrice(accessToken, coinbaseService.getAvailableCurrency(), function(err, sell) {
        if (err) {
          $log.debug(coinbaseService.getErrorsAsString(err.errors));
          checkTransaction(count, txp);
          return;
        }
        sellPrice = sell.data;

        coinbaseService.getTransactions(accessToken, accountId, function(err, ctxs) {
          if (err) {
            $log.debug(coinbaseService.getErrorsAsString(err.errors));
            checkTransaction(count, txp);
            return;
          }

          var coinbaseTransactions = ctxs.data;
          var txFound = false;
          var ctx;
          for(var i = 0; i < coinbaseTransactions.length; i++) {
            ctx = coinbaseTransactions[i];
            if (ctx.type == 'send' && ctx.from && ctx.amount.amount == amountBTC ) {
              $log.warn('Transaction found!', ctx);
              txFound = true;
              $log.debug('Saving transaction to process later...');
              ctx['payment_method'] = $scope.selectedPaymentMethodId.value;
              ctx['status'] = 'pending'; // Forcing "pending" status to process later
              ctx['price_sensitivity'] = $scope.selectedPriceSensitivity.data;
              ctx['sell_price_amount'] = sellPrice ? sellPrice.amount : '';
              ctx['sell_price_currency'] = sellPrice ? sellPrice.currency : 'USD';
              ctx['description'] = appConfigService.nameCase + ' Wallet: ' + $scope.wallet.name;
              coinbaseService.savePendingTransaction(ctx, null, function(err) {
                ongoingProcess.set('sellingBitcoin', false, statusChangeHandler);
                if (err) $log.debug(coinbaseService.getErrorsAsString(err.errors));
              });
              return;
            }
          }
          if (!txFound) {
            // Transaction sent, but could not be verified by Coinbase.com
            $log.warn('Transaction not found in Coinbase. Will try 5 times...');
            if (count < 5) {
              checkTransaction(count + 1, txp);
            } else {
              ongoingProcess.set('sellingBitcoin', false, statusChangeHandler);
              showError('No transaction found');
              return;
            }
          }
        });
      });
    });
  }, 8000, {
    'leading': true
  });

  var statusChangeHandler = function (processName, showName, isOn) {
    $log.debug('statusChangeHandler: ', processName, showName, isOn);
    if ( processName == 'sellingBitcoin' && !isOn) {
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
    $scope.isFiat = data.stateParams.currency != 'BTC' ? true : false;
    amount = data.stateParams.amount;
    currency = data.stateParams.currency;

    $scope.priceSensitivity = coinbaseService.priceSensitivity;
    $scope.selectedPriceSensitivity = { data: coinbaseService.selectedPriceSensitivity };

    $scope.network = coinbaseService.getNetwork();
    $scope.wallets = profileService.getWallets({
      m: 1, // Only 1-signature wallet
      onlyComplete: true,
      network: $scope.network,
      hasFunds: true,
      coin: coin
    });

    if (lodash.isEmpty($scope.wallets)) {
      showErrorAndBack('No wallet available to operate with Coinbase');
      return;
    }
    $scope.onWalletSelect($scope.wallets[0]); // Default first wallet
  });

  $scope.sellRequest = function() {
    ongoingProcess.set('connectingCoinbase', true);
    coinbaseService.init(function(err, res) {
      if (err) {
        ongoingProcess.set('connectingCoinbase', false);
        showErrorAndBack(coinbaseService.getErrorsAsString(err.errors));
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
      coinbaseService.sellRequest(accessToken, accountId, dataSrc, function(err, data) {
        ongoingProcess.set('connectingCoinbase', false);
        if (err) {
          showErrorAndBack(coinbaseService.getErrorsAsString(err.errors));
          return;
        }
        $scope.sellRequestInfo = data.data;
        $timeout(function() {
          $scope.$apply();
        }, 100);
      });
    });
  };

  $scope.sellConfirm = function() {
    var config = configService.getSync();
    var configWallet = config.wallet;
    var walletSettings = configWallet.settings;

    var message = 'Selling bitcoin for ' + amount + ' ' + currency;
    var okText = 'Confirm';
    var cancelText = 'Cancel';
    popupService.showConfirm(null, message, okText, cancelText, function(ok) {
      if (!ok) return;

      ongoingProcess.set('sellingBitcoin', true, statusChangeHandler);
      coinbaseService.init(function(err, res) {
        if (err) {
          ongoingProcess.set('sellingBitcoin', false, statusChangeHandler);
          showError(coinbaseService.getErrorsAsString(err.errors));
          return;
        }
        var accessToken = res.accessToken;
        var accountId = res.accountId;

        var dataSrc = {
          name: 'Received from ' + appConfigService.nameCase
        };
        coinbaseService.createAddress(accessToken, accountId, dataSrc, function(err, data) {
          if (err) {
            ongoingProcess.set('sellingBitcoin', false, statusChangeHandler);
            showError(coinbaseService.getErrorsAsString(err.errors));
            return;
          }
          var outputs = [];
          var toAddress = data.data.address;
          var amountSat = parseInt(($scope.sellRequestInfo.amount.amount * 100000000).toFixed(0));
          var comment = 'Sell bitcoin (Coinbase)';

          outputs.push({
            'toAddress': toAddress,
            'amount': amountSat,
            'message': comment
          });

          var txp = {
            toAddress: toAddress,
            amount: amountSat,
            outputs: outputs,
            message: comment,
            payProUrl: null,
            excludeUnconfirmedUtxos: configWallet.spendUnconfirmed ? false : true,
            feeLevel: walletSettings.feeLevel || 'normal'
          };

          walletService.createTx($scope.wallet, txp, function(err, ctxp) {
            if (err) {
              ongoingProcess.set('sellingBitcoin', false, statusChangeHandler);
              showError(err);
              return;
            }
            $log.debug('Transaction created.');
            publishAndSign($scope.wallet, ctxp, function() {}, function(err, txSent) {
              if (err) {
                ongoingProcess.set('sellingBitcoin', false, statusChangeHandler);
                showError(err);
                return;
              }
              $log.debug('Transaction broadcasted. Wait for Coinbase confirmation...');
              checkTransaction(1, txSent);
            });
          });
        });
      });
    });
  };

  $scope.showWalletSelector = function() {
    $scope.walletSelectorTitle = 'Sell From';
    $scope.showWallets = true;
  };

  $scope.onWalletSelect = function(wallet) {
    $scope.wallet = wallet;
    var parsedAmount = txFormatService.parseAmount(
      coin,
      amount,
      currency);

    amount = parsedAmount.amount;
    currency = parsedAmount.currency;
    $scope.amountUnitStr = parsedAmount.amountUnitStr;
    processPaymentInfo();
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
