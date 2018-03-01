'use strict';

angular.module('copayApp.controllers').controller('topUpController', function($scope, $log, $state, $timeout, $ionicHistory, $ionicConfig, $ionicModal, lodash, popupService, profileService, ongoingProcess, walletService, configService, platformInfo, bitpayService, bitpayCardService, payproService, bwcError, txFormatService, sendMaxService, gettextCatalog, externalLinkService, bitcoreCash) {

  var FEE_TOO_HIGH_LIMIT_PER = 15;
  $scope.isCordova = platformInfo.isCordova;
  var cardId;
  var useSendMax;
  var amount;
  var currency;
  var createdTx;
  var message;
  var configWallet = configService.getSync().wallet;

  var _resetValues = function() {
    $scope.totalAmountStr = $scope.amount = $scope.invoiceFee = $scope.networkFee = $scope.totalAmount = $scope.wallet = null;
    createdTx = message = null;
  };

  var showErrorAndBack = function(title, msg) {
    title = title || gettextCatalog.getString('Error');
    $scope.sendStatus = '';
    $log.error(msg);
    msg = msg.errors ? msg.errors[0].message : msg;
    popupService.showAlert(title, msg, function() {
      $ionicHistory.goBack();
    });
  };

  var showError = function(title, msg, cb) {
    cb = cb || function() {};
    title = title || gettextCatalog.getString('Error');
    $scope.sendStatus = '';
    $log.error(msg);
    msg = msg.errors ? msg.errors[0].message : msg;
    popupService.showAlert(title, msg, cb);
  };

  var satToFiat = function(coin, sat, cb) {
    txFormatService.toFiat(coin, sat, $scope.currencyIsoCode, function(value) {
      return cb(value);
    });
  };

  var publishAndSign = function(wallet, txp, onSendStatusChange, cb) {
    if (!wallet.canSign() && !wallet.isPrivKeyExternal()) {
      var err = gettextCatalog.getString('No signing proposal: No private key');
      $log.info(err);
      return cb(err);
    }

    walletService.publishAndSign(wallet, txp, function(err, txp) {
      if (err) {
        return cb(err);
      }
      return cb(null, txp);
    }, onSendStatusChange);
  };

  var statusChangeHandler = function(processName, showName, isOn) {
    $log.debug('statusChangeHandler: ', processName, showName, isOn);
    if (processName == 'topup' && !isOn) {
      $scope.sendStatus = 'success';
      $timeout(function() {
        $scope.$digest();
      }, 100);
    } else if (showName) {
      $scope.sendStatus = showName;
    }
  };

  var setTotalAmount = function(wallet, amountSat, invoiceFeeSat, networkFeeSat) {
    satToFiat(wallet.coin, amountSat, function(a) {
      $scope.amount = Number(a);

      satToFiat(wallet.coin, invoiceFeeSat, function(i) {
        $scope.invoiceFee = Number(i);

        satToFiat(wallet.coin, networkFeeSat, function(n) {
          $scope.networkFee = Number(n);
          $scope.totalAmount = $scope.amount + $scope.invoiceFee + $scope.networkFee;
          $timeout(function() {
            $scope.$digest();
          });
        });
      });
    });
  };

  var isCryptoCurrencySupported = function(wallet, invoice) {
    var COIN = wallet.coin.toUpperCase();
    if (!invoice['supportedTransactionCurrencies'][COIN]) return false;
    return invoice['supportedTransactionCurrencies'][COIN].enabled;
  };

  var createInvoice = function(data, cb) {
    bitpayCardService.topUp(cardId, data, function(err, invoiceId) {
      if (err) {
        return cb({
          title: gettextCatalog.getString('Could not create the invoice'),
          message: err
        });
      }

      bitpayCardService.getInvoice(invoiceId, function(err, inv) {
        if (err) {
          return cb({
            title: gettextCatalog.getString('Could not get the invoice'),
            message: err
          });
        }
        return cb(null, inv);
      });
    });
  };

  var createTx = function(wallet, invoice, message, cb) {
    var COIN = wallet.coin.toUpperCase();
    var payProUrl = (invoice && invoice.paymentCodes) ? invoice.paymentCodes[COIN].BIP73 : null;

    if (!payProUrl) {
      return cb({
        title: gettextCatalog.getString('Error in Payment Protocol'),
        message: gettextCatalog.getString('Invalid URL')
      });
    }

    var outputs = [];

    payproService.getPayProDetails(payProUrl, wallet.coin, function(err, details) {
      if (err) {
        return cb({
          title: gettextCatalog.getString('Error in Payment Protocol'),
          message: gettextCatalog.getString('Invalid URL')
        });
      }

      var txp = {
        amount: details.amount,
        toAddress: details.toAddress,
        outputs: [{
            'toAddress': details.toAddress,
            'amount': details.amount,
            'message': message
        }],
        message: message,
        payProUrl: payProUrl,
        excludeUnconfirmedUtxos: configWallet.spendUnconfirmed ? false : true,
      };

      if (details.requiredFeeRate) {
        txp.feePerKb = Math.ceil(details.requiredFeeRate * 1024);
        $log.debug('Using merchant fee rate (for debit card): ' + txp.feePerKb);
      } else {
        txp.feeLevel = configWallet.settings.feeLevel || 'normal';
      }

      txp['origToAddress'] = txp.toAddress;

      if (wallet.coin && wallet.coin == 'bch') {
        // Use legacy address
        txp.toAddress = new bitcoreCash.Address(txp.toAddress).toString();
        txp.outputs[0].toAddress = txp.toAddress;
      }

      walletService.createTx(wallet, txp, function(err, ctxp) {
        if (err) {
          return cb({
            title: gettextCatalog.getString('Could not create transaction'),
            message: bwcError.msg(err)
          });
        }
        return cb(null, ctxp);
      });
    });
  };

  var calculateAmount = function(wallet, cb) {
    var COIN = wallet.coin.toUpperCase();
    
    // Global variables defined beforeEnter
    var a = amount;
    var c = currency;

    if (useSendMax) {
      sendMaxService.getInfo(wallet, function(err, maxValues) {
        if (err) {
          return cb({
            title: null,
            message: err
          })
        }

        if (maxValues.amount == 0) {
          return cb({
            message: gettextCatalog.getString('Insufficient funds for fee')
          });
        }

        var maxAmount = Number((maxValues.amount / 100000000).toFixed(8));

        createInvoice({
          amount: maxAmount,
          currency: wallet.coin.toUpperCase(),
          buyerSelectedTransactionCurrency: wallet.coin.toUpperCase()
        }, function(err, inv) {
          if (err) return cb(err);

          // Check if BTC or BCH is enabled in this account
          if (!isCryptoCurrencySupported(wallet, inv)) {
            var msg = gettextCatalog.getString('Top-up with this cryptocurrency is not enabled');
            showErrorAndBack(null, msg);
            return cb({
              message: msg
            });
          }

          inv['minerFees'][COIN]['totalFee'] = inv.minerFees[COIN].totalFee || 0;
          var invoiceFeeSat = inv.minerFees[COIN].totalFee;
          var newAmountSat = maxValues.amount - invoiceFeeSat;

          if (newAmountSat <= 0) {
            return cb({
              message: gettextCatalog.getString('Insufficient funds for fee')
            });
          }

          return cb(null, newAmountSat, 'sat');
        });
      });
    } else {
      return cb(null, a, c);
    }
  };

  var checkFeeHigh = function(amount, fee) {
    var per = fee / (amount + fee) * 100;

    if (per > FEE_TOO_HIGH_LIMIT_PER) {
      $ionicModal.fromTemplateUrl('views/modals/fee-warning.html', {
        scope: $scope
      }).then(function(modal) {
        $scope.feeWarningModal = modal;
        $scope.feeWarningModal.show();
      });

      $scope.close = function() {
        $scope.feeWarningModal.hide();
      };
    }
  }

  var initializeTopUp = function(wallet, parsedAmount) {
    var COIN = wallet.coin.toUpperCase();
    $scope.amountUnitStr = parsedAmount.amountUnitStr;
    var dataSrc = {
      amount: parsedAmount.amount,
      currency: parsedAmount.currency,
      buyerSelectedTransactionCurrency: wallet.coin.toUpperCase()
    };
    ongoingProcess.set('loadingTxInfo', true);
    createInvoice(dataSrc, function(err, invoice) {
      if (err) {
        ongoingProcess.set('loadingTxInfo', false);
        showErrorAndBack(err.title, err.message);
        return;
      }

      // Check if BTC or BCH is enabled in this account
      if (!isCryptoCurrencySupported(wallet, invoice)) {
        ongoingProcess.set('loadingTxInfo', false);
        var msg = gettextCatalog.getString('Top-up with this cryptocurrency is not enabled');
        showErrorAndBack(null, msg);
        return;
      }

      // Sometimes API does not return this element;
      invoice['minerFees'][COIN]['totalFee'] = invoice.minerFees[COIN].totalFee || 0;
      var invoiceFeeSat = invoice.minerFees[COIN].totalFee;

      message = gettextCatalog.getString("Top up {{amountStr}} to debit card ({{cardLastNumber}})", {
        amountStr: $scope.amountUnitStr,
        cardLastNumber: $scope.lastFourDigits
      });

      createTx(wallet, invoice, message, function(err, ctxp) {
        ongoingProcess.set('loadingTxInfo', false);
        if (err) {
          _resetValues();
          showError(err.title, err.message);
          return;
        }

        // Save TX in memory
        createdTx = ctxp;

        $scope.totalAmountStr = txFormatService.formatAmountStr(wallet.coin, ctxp.amount);

        // Warn: fee too high
        checkFeeHigh(Number(parsedAmount.amountSat), Number(invoiceFeeSat) + Number(ctxp.fee));

        setTotalAmount(wallet, parsedAmount.amountSat, invoiceFeeSat, ctxp.fee);

      });

    });

  };

  var updateRates = function(coin) {
    bitpayCardService.getRatesFromCoin(coin.toUpperCase(), $scope.currencyIsoCode, function(err, r) {
      if (err) $log.error(err);
      $scope.rate = r.rate;
    });
  };

  $scope.$on("$ionicView.beforeLeave", function(event, data) {
    $ionicConfig.views.swipeBackEnabled(true);
  });

  $scope.$on("$ionicView.enter", function(event, data) {
    $ionicConfig.views.swipeBackEnabled(false);
  });

  $scope.$on("$ionicView.beforeEnter", function(event, data) {

    cardId = data.stateParams.id;
    useSendMax = data.stateParams.useSendMax;
    amount = data.stateParams.amount;
    currency = data.stateParams.currency;

    var coin;
    if (currency == 'BTC') coin = 'btc';
    if (currency == 'BCH') coin = 'bch';

    bitpayCardService.get({
      cardId: cardId,
      noRefresh: true
    }, function(err, card) {
      if (err) {
        showErrorAndBack(null, err);
        return;
      }
      bitpayCardService.setCurrencySymbol(card[0]);
      $scope.lastFourDigits = card[0].lastFourDigits;
      $scope.currencySymbol = card[0].currencySymbol;
      $scope.currencyIsoCode = card[0].currency;

      $scope.wallets = profileService.getWallets({
        onlyComplete: true,
        network: bitpayService.getEnvironment().network,
        hasFunds: true,
        coin: coin
      });

      if (lodash.isEmpty($scope.wallets)) {
        showErrorAndBack(null, gettextCatalog.getString('No wallets available'));
        return;
      }

      $scope.showWalletSelector(); // Show wallet selector
    });
  });

  $scope.topUpConfirm = function() {

    if (!createdTx) {
      showError(null, gettextCatalog.getString('Transaction has not been created'));
      return;
    }

    var title = gettextCatalog.getString('Confirm');
    var okText = gettextCatalog.getString('OK');
    var cancelText = gettextCatalog.getString('Cancel');
    popupService.showConfirm(title, message, okText, cancelText, function(ok) {
      if (!ok) {
        $scope.sendStatus = '';
        return;
      }

      ongoingProcess.set('topup', true, statusChangeHandler);
      publishAndSign($scope.wallet, createdTx, function() {}, function(err, txSent) {
        if (err) {
          _resetValues();
          ongoingProcess.set('topup', false, statusChangeHandler);
          showError(gettextCatalog.getString('Could not send transaction'), err);
          return;
        }
        ongoingProcess.set('topup', false, statusChangeHandler);
      });
    });
  };

  $scope.showWalletSelector = function() {
    $scope.walletSelectorTitle = gettextCatalog.getString('From');
    $scope.showWallets = true;
  };

  $scope.onWalletSelect = function(wallet) {
    $scope.wallet = wallet;
    
    // Update Rates
    updateRates(wallet.coin);
    
    ongoingProcess.set('retrievingInputs', true);
    calculateAmount(wallet, function(err, a, c) {
      ongoingProcess.set('retrievingInputs', false);
      if (err) {
        _resetValues();
        showError(err.title, err.message, function() {
          $scope.showWalletSelector();
        });
        return;
      }
      var parsedAmount = txFormatService.parseAmount(wallet.coin, a, c);
      initializeTopUp(wallet, parsedAmount);
    });
  };

  $scope.goBackHome = function() {
    $scope.sendStatus = '';
    $ionicHistory.nextViewOptions({
      disableAnimate: true,
      historyRoot: true
    });
    $ionicHistory.clearHistory();
    $state.go('tabs.home').then(function() {
      $state.transitionTo('tabs.bitpayCard', {
        id: cardId
      });
    });
  };

  $scope.openExternalLink = function(url) {
    externalLinkService.open(url);
  };

});
