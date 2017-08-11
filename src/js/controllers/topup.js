'use strict';

angular.module('copayApp.controllers').controller('topUpController', function($scope, $log, $state, $timeout, $ionicHistory, $ionicConfig, lodash, popupService, profileService, ongoingProcess, walletService, configService, platformInfo, bitpayService, bitpayCardService, payproService, bwcError, txFormatService, sendMaxService, gettextCatalog, networkService) {

  $scope.isCordova = platformInfo.isCordova;
  var cardId;
  var useSendMax;
  var amount;
  var currency;
  var createdTx;
  var message;
  var configWallet = configService.getSync().wallet;

  // Support only livenet/btc
  var atomicUnit = networkService.getAtomicUnit('livenet/btc');
  $scope.standardUnit = networkService.getStandardUnit('livenet/btc');

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

  var atomicToFiat = function(atomics, cb) {
    // Support only livenet/btc
    txFormatService.toFiat('livenet/btc', atomics, $scope.currencyIsoCode, function(value) {
      return cb(value);
    });
  };

  var publishAndSign = function (wallet, txp, onSendStatusChange, cb) {
    if (!wallet.canSign() && !wallet.isPrivKeyExternal()) {
      var err = gettextCatalog.getString('No signing proposal: No private key');
      $log.info(err);
      return cb(err);
    }

    walletService.publishAndSign(wallet, txp, function(err, txp) {
      if (err) return cb(err);
      return cb(null, txp);
    }, onSendStatusChange);
  };

  var statusChangeHandler = function (processName, showName, isOn) {
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

  var setTotalAmount = function(amountAtomic, invoiceFeeAtomic, networkFeeAtomic) {
    atomicToFiat(amountAtomic, function(a) {
      $scope.amount = Number(a);

      atomicToFiat(invoiceFeeAtomic, function(i) {
        $scope.invoiceFee = Number(i);

        atomicToFiat(networkFeeAtomic, function(n) {
          $scope.networkFee = Number(n);
          $scope.totalAmount = $scope.amount + $scope.invoiceFee + $scope.networkFee;
          $timeout(function() {
            $scope.$digest();
          });
        });
      });
    });
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
    var payProUrl = (invoice && invoice.paymentUrls) ? invoice.paymentUrls.BIP73 : null;

    if (!payProUrl) {
      return cb({
        title: gettextCatalog.getString('Error in Payment Protocol'),
        message: gettextCatalog.getString('Invalid URL')
      });
    }

    var outputs = [];
    var toAddress = invoice.bitcoinAddress;
    var amountAtomic = parseInt((invoice.btcDue * $scope.standardUnit.value).toFixed(atomicUnit.digits));

    outputs.push({
      'toAddress': toAddress,
      'amount': amountAtomic,
      'message': message
    });

    var txp = {
      toAddress: toAddress,
      amount: amountAtomic,
      outputs: outputs,
      message: message,
      payProUrl: payProUrl,
      excludeUnconfirmedUtxos: configWallet.spendUnconfirmed ? false : true,
      feeLevel: configWallet.settings.feeLevel || 'normal'
    };

    walletService.createTx(wallet, txp, function(err, ctxp) {
      if (err) {
        return cb({
          title: gettextCatalog.getString('Could not create transaction'),
          message: bwcError.msg(err)
        });
      }
      return cb(null, ctxp);
    });
  };

  var calculateAmount = function(wallet, cb) {
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
          return cb({message: gettextCatalog.getString('Insufficient funds for fee')});
        }

        var maxAmountStandard = Number((maxValues.amount / $scope.standardUnit.value).toFixed($scope.standardUnit.decimals));

        createInvoice({amount: maxAmountStandard, currency: $scope.standardUnit.shortName}, function(err, inv) {
          if (err) return cb(err);

          var invoiceFeeAtomic = parseInt((inv.buyerPaidBtcMinerFee * $scope.standardUnit.value).toFixed());
          var newAmountAtomic = maxValues.amount - invoiceFeeAtomic;

          if (newAmountAtomic <= 0) {
            return cb({message: gettextCatalog.getString('Insufficient funds for fee')});
          }

          return cb(null, newAmountAtomic, atomicUnit.shortName);
        });
      });
    } else {
      return cb(null, a, c);
    }
  };

  var initializeTopUp = function(wallet, parsedAmount) {
    $scope.amountAtomicStr = parsedAmount.amountAtomicStr;
    var dataSrc = {
      amount: parsedAmount.amount,
      currency: parsedAmount.currency
    };
    ongoingProcess.set('loadingTxInfo', true);
    createInvoice(dataSrc, function(err, invoice) {
      if (err) {
        ongoingProcess.set('loadingTxInfo', false);
        showErrorAndBack(err.title, err.message);
        return;
      }

      // Sometimes API does not return this element;
      invoice['buyerPaidBtcMinerFee'] = invoice.buyerPaidBtcMinerFee || 0;
      var invoiceFeeAtomic = (invoice.buyerPaidBtcMinerFee * $scope.standardUnit.value).toFixed();

      message = gettextCatalog.getString("Top up {{amountStr}} to debit card ({{cardLastNumber}})", {
        amountStr: $scope.amountAtomicStr,
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

        $scope.totalAmountStr = txFormatService.formatAmountStr('livenet/btc', ctxp.amount); // Support only livenet/btc

        setTotalAmount(parsedAmount.amountAtomic, invoiceFeeAtomic, ctxp.fee);

      });

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

    bitpayCardService.get({ cardId: cardId, noRefresh: true }, function(err, card) {
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
        hasFunds: true
      });

      if (lodash.isEmpty($scope.wallets)) {
        showErrorAndBack(null, gettextCatalog.getString('No wallets available'));
        return;
      }

      bitpayCardService.getRates($scope.currencyIsoCode, function(err, r) {
        if (err) $log.error(err);
        $scope.rate = r.rate;
      });

      $scope.onWalletSelect($scope.wallets[0]); // Default first wallet
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
      var parsedAmount = txFormatService.parseAmount('livenet/btc', a, c); // Support only livenet/btc
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
      $state.transitionTo('tabs.bitpayCard', {id: cardId});
    });
  };

});
