'use strict';

angular.module('copayApp.controllers').controller('sellCoinbaseController', function($scope, $log, $state, $timeout, $ionicHistory, $ionicScrollDelegate, $ionicConfig, lodash, coinbaseService, popupService, profileService, ongoingProcess, walletService, appConfigService, configService, txFormatService, networkHelper) {

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

  var checkTransaction = lodash.throttle(function(count, txp) {
    $log.warn('Check if transaction has been received by Coinbase. Try ' + count + '/5');
    // TX amount in standard units (BTC)
    var standardUnit = networkHelper.getStandardUnit('livenet/btc'); // Support only livenet/btc
    var amountStandard = (txp.amount / standardUnit.value).toFixed(standardUnit.decimals);
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
          $log.debug(err);
          checkTransaction(count, txp);
          return;
        }
        sellPrice = sell.data;

        coinbaseService.getTransactions(accessToken, accountId, function(err, ctxs) {
          if (err) {
            $log.debug(err);
            checkTransaction(count, txp);
            return;
          }

          var coinbaseTransactions = ctxs.data;
          var txFound = false;
          var ctx;
          for(var i = 0; i < coinbaseTransactions.length; i++) {
            ctx = coinbaseTransactions[i];
            if (ctx.type == 'send' && ctx.from && ctx.amount.amount == amountStandard ) {
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
                if (err) $log.debug(err);
              });
              return;
            }
          }
          if (!txFound) {
            // Transaction sent, but could not be verified by Coinbase.com
            $log.warn('Transaction not found in Coinbase.');
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
    var networkUnits = networkHelper.getNetworkByName('livenet/btc').units; // Support only livenet/btc
    var foundCurrencyName = lodash.find(networkUnits, function(u) {
      return u.shortName == data.stateParams.currency;
    });

    $scope.isFiat = !foundCurrencyName;

    var parsedAmount = txFormatService.parseAmount(
      'livenet/btc', //Support only livenet/btc
      data.stateParams.amount, 
      data.stateParams.currency);

    amount = parsedAmount.amount;
    currency = parsedAmount.currency;
    $scope.amountAtomicStr = parsedAmount.amountAtomicStr;

    $scope.priceSensitivity = coinbaseService.priceSensitivity;
    $scope.selectedPriceSensitivity = { data: coinbaseService.selectedPriceSensitivity };
    
    $scope.network = coinbaseService.getNetwork();
    $scope.wallets = profileService.getWallets({
      m: 1, // Only 1-signature wallet
      onlyComplete: true,
      network: $scope.network,
      hasFunds: true,
      minAmount: parsedAmount.amountAtomic
    });

    if (lodash.isEmpty($scope.wallets)) {
      showErrorAndBack('Insufficient funds');
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

      coinbaseService.sellPrice(accessToken, coinbaseService.getAvailableCurrency(), function(err, s) {
        $scope.sellPrice = s.data || null;
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
          showErrorAndBack('No payment method available to sell');
          return;
        }
        if (!hasPrimary) $scope.selectedPaymentMethodId.value = $scope.paymentMethods[0].id;
        $scope.sellRequest();
      });
    });   
  });

  $scope.sellRequest = function() {
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
      coinbaseService.sellRequest(accessToken, accountId, dataSrc, function(err, data) {
        ongoingProcess.set('connectingCoinbase', false);
        if (err) {
          showErrorAndBack(err);
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
    var networkSettings = config.currencyNetworks['livenet/btc']; // Support only livenet/btc

    var message = 'Selling bitcoin for ' + amount + ' ' + currency;
    var okText = 'Confirm';
    var cancelText = 'Cancel';
    popupService.showConfirm(null, message, okText, cancelText, function(ok) {
      if (!ok) return;
      
      ongoingProcess.set('sellingBitcoin', true, statusChangeHandler);
      coinbaseService.init(function(err, res) {
        if (err) {
          ongoingProcess.set('sellingBitcoin', false, statusChangeHandler);
          showError(err);
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
            showError(err);
            return;
          }

          // Support only livenet/btc
          var atomicUnit = networkHelper.getAtomicUnit('livenet/btc');
          var standardUnit = networkHelper.getStandardUnit('livenet/btc');

          var outputs = [];
          var toAddress = data.data.address;
          var amountAtomic = parseInt(($scope.sellRequestInfo.amount.amount * standardUnit.value).toFixed(atomicUnit.decimals));
          var comment = 'Sell bitcoin (Coinbase)';

          outputs.push({
            'toAddress': toAddress,
            'amount': amountAtomic,
            'message': comment
          });

          var txp = {
            toAddress: toAddress,
            amount: amountAtomic,
            outputs: outputs,
            message: comment,
            payProUrl: null,
            excludeUnconfirmedUtxos: configWallet.spendUnconfirmed ? false : true,
            feeLevel: networkSettings.feeLevel || 'normal'
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
