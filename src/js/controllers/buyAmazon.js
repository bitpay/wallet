'use strict';

angular.module('copayApp.controllers').controller('buyAmazonController', function($scope, $log, $state, $timeout, $filter, $ionicHistory, $ionicConfig, lodash, amazonService, popupService, profileService, ongoingProcess, configService, walletService, payproService, bwcError, externalLinkService, platformInfo, gettextCatalog, txFormatService) {

  var amount;
  var currency;
  var createdTx;
  var message;
  var invoiceId;
  var configWallet = configService.getSync().wallet;
  $scope.isCordova = platformInfo.isCordova;

  $scope.openExternalLink = function(url) {
    externalLinkService.open(url);
  };

  var _resetValues = function() {
    $scope.totalAmountStr = $scope.amount = $scope.invoiceFee = $scope.networkFee = $scope.totalAmount = $scope.wallet = null;
    createdTx = message = invoiceId = null;
  };

  var showErrorAndBack = function(title, msg) {
    title = title || gettextCatalog.getString('Error');
    $scope.sendStatus = '';
    $log.error(msg);
    msg = (msg && msg.errors) ? msg.errors[0].message : msg;
    popupService.showAlert(title, msg, function() {
      $ionicHistory.goBack();
    });
  };

  var showError = function(title, msg, cb) {
    cb = cb || function() {};
    title = title || gettextCatalog.getString('Error');
    $scope.sendStatus = '';
    $log.error(msg);
    msg = (msg && msg.errors) ? msg.errors[0].message : msg;
    popupService.showAlert(title, msg, cb);
  };

  var publishAndSign = function(wallet, txp, onSendStatusChange, cb) {
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

  var statusChangeHandler = function(processName, showName, isOn) {
    $log.debug('statusChangeHandler: ', processName, showName, isOn);
    if (processName == 'buyingGiftCard' && !isOn) {
      $scope.sendStatus = 'success';
      $timeout(function() {
        $scope.$digest();
      }, 100);
    } else if (showName) {
      $scope.sendStatus = showName;
    }
  };

  var satToFiat = function(sat, cb) {
    txFormatService.toFiat(sat, $scope.currencyIsoCode, function(value) {
      return cb(value);
    });
  };

  var setTotalAmount = function(amountSat, invoiceFeeSat, networkFeeSat) {
    satToFiat(amountSat, function(a) {
      $scope.amount = Number(a);

      satToFiat(invoiceFeeSat, function(i) {
        $scope.invoiceFee = Number(i);

        satToFiat(networkFeeSat, function(n) {
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
    amazonService.createBitPayInvoice(data, function(err, dataInvoice) {
      if (err) {
        var err_title = gettextCatalog.getString('Error creating the invoice');
        var err_msg;
        if (err && err.message && err.message.match(/suspended/i)) {
          err_title = gettextCatalog.getString('Service not available');
          err_msg = gettextCatalog.getString('Amazon.com Gift Card Service is not available at this moment. Please try back later.');
        } else if (err && err.message) {
          err_msg = err.message;
        } else {
          err_msg = gettextCatalog.getString('Could not access Gift Card Service');
        };

        return cb({
          title: err_title,
          message: err_msg
        });
      }

      var accessKey = dataInvoice ? dataInvoice.accessKey : null;

      if (!accessKey) {
        return cb({
          message: gettextCatalog.getString('No access key defined')
        });
      }

      amazonService.getBitPayInvoice(dataInvoice.invoiceId, function(err, invoice) {
        if (err) {
          return cb({
            message: gettextCatalog.getString('Could not get the invoice')
          });
        }

        return cb(null, invoice, accessKey);
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
    var amountSat = parseInt(invoice.btcDue * 100000000); // BTC to Satoshi

    outputs.push({
      'toAddress': toAddress,
      'amount': amountSat,
      'message': message
    });

    var txp = {
      toAddress: toAddress,
      amount: amountSat,
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

  var checkTransaction = lodash.throttle(function(count, dataSrc) {
    amazonService.createGiftCard(dataSrc, function(err, giftCard) {
      $log.debug("creating gift card " + count);
      if (err) {
        ongoingProcess.set('buyingGiftCard', false, statusChangeHandler);
        giftCard = {};
        giftCard.status = 'FAILURE';
        showError(gettextCatalog.getString('Error creating gift card'), err);
      }

      if (giftCard.status == 'PENDING' && count < 3) {
        $log.debug("Waiting for payment confirmation");
        checkTransaction(count + 1, dataSrc);
        return;
      }

      var now = moment().unix() * 1000;

      var newData = giftCard;
      newData['invoiceId'] = dataSrc.invoiceId;
      newData['accessKey'] = dataSrc.accessKey;
      newData['invoiceUrl'] = dataSrc.invoiceUrl;
      newData['amount'] = dataSrc.amount;
      newData['date'] = dataSrc.invoiceTime || now;
      newData['uuid'] = dataSrc.uuid;

      if (newData.status == 'expired') {
        amazonService.savePendingGiftCard(newData, {
          remove: true
        }, function(err) {
          $log.error(err);
          ongoingProcess.set('buyingGiftCard', false, statusChangeHandler);
          showError(null, gettextCatalog.getString('Gift card expired'));
        });
        return;
      }

      amazonService.savePendingGiftCard(newData, null, function(err) {
        ongoingProcess.set('buyingGiftCard', false, statusChangeHandler);
        $log.debug("Saving new gift card with status: " + newData.status);
        $scope.amazonGiftCard = newData;
      });
    });
  }, 8000, {
    'leading': true
  });

  var initialize = function(wallet) {
    var parsedAmount = txFormatService.parseAmount(amount, currency);
    $scope.currencyIsoCode = parsedAmount.alternativeIsoCode;
    $scope.amountUnitStr = parsedAmount.amountUnitStr;
    var dataSrc = {
      amount: parsedAmount.amount,
      currency: parsedAmount.currency,
      uuid: wallet.id
    };
    ongoingProcess.set('loadingTxInfo', true);
    createInvoice(dataSrc, function(err, invoice, accessKey) {
      if (err) {
        ongoingProcess.set('loadingTxInfo', false);
        showErrorAndBack(err.title, err.message);
        return;
      }
      // Sometimes API does not return this element;
      invoice['buyerPaidBtcMinerFee'] = invoice.buyerPaidBtcMinerFee || 0;
      var invoiceFeeSat = (invoice.buyerPaidBtcMinerFee * 100000000).toFixed();

      message = gettextCatalog.getString("Amazon.com Gift Card {{amountStr}}", {
        amountStr: $scope.amountUnitStr
      });

      createTx(wallet, invoice, message, function(err, ctxp) {
        ongoingProcess.set('loadingTxInfo', false);
        if (err) {
          _resetValues();
          showError(err.title, err.message);
          return;
        }

        // Save in memory
        createdTx = ctxp;
        invoiceId = invoice.id;

        createdTx['giftData'] = {
          currency: dataSrc.currency,
          amount: dataSrc.amount,
          uuid: dataSrc.uuid,
          accessKey: accessKey,
          invoiceId: invoice.id,
          invoiceUrl: invoice.url,
          invoiceTime: invoice.invoiceTime
        };
        $scope.totalAmountStr = txFormatService.formatAmountStr(ctxp.amount);
        setTotalAmount(parsedAmount.amountSat, invoiceFeeSat, ctxp.fee);
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
    amount = data.stateParams.amount;
    currency = data.stateParams.currency;

    $scope.limitPerDayMessage = gettextCatalog.getString('Purchase Amount is limited to {{limitPerDay}} {{currency}} per day', {
      limitPerDay: amazonService.limitPerDay,
      currency: currency
    });

    if (amount > amazonService.limitPerDay) {
      showErrorAndBack(null, $scope.limitPerDayMessage);
      return;
    }

    $scope.network = amazonService.getNetwork();
    $scope.wallets = profileService.getWallets({
      onlyComplete: true,
      network: $scope.network,
      hasFunds: true
    });
    if (lodash.isEmpty($scope.wallets)) {
      showErrorAndBack(null, gettextCatalog.getString('No wallets available'));
      return;
    }
    $scope.onWalletSelect($scope.wallets[0]); // Default first wallet
  });

  $scope.buyConfirm = function() {
    if (!createdTx) {
      showError(null, gettextCatalog.getString('Transaction has not been created'));
      return;
    }
    var title = gettextCatalog.getString('Confirm');
    var okText = gettextCatalog.getString('Ok');
    var cancelText = gettextCatalog.getString('Cancel');
    popupService.showConfirm(title, message, okText, cancelText, function(ok) {
      if (!ok) {
        $scope.sendStatus = '';
        return;
      }

      ongoingProcess.set('buyingGiftCard', true, statusChangeHandler);
      publishAndSign($scope.wallet, createdTx, function() {}, function(err, txSent) {
        if (err) {
          _resetValues();
          ongoingProcess.set('buyingGiftCard', false, statusChangeHandler);
          showError(gettextCatalog.getString('Could not send transaction'), err);
          return;
        }
        checkTransaction(1, createdTx.giftData);
      });
    });
  };

  $scope.showWalletSelector = function() {
    $scope.walletSelectorTitle = gettextCatalog.getString('Buy from');
    $scope.showWallets = true;
  };

  $scope.onWalletSelect = function(wallet) {
    $scope.wallet = wallet;
    initialize(wallet);
  };

  $scope.goBackHome = function() {
    $scope.sendStatus = '';
    $ionicHistory.nextViewOptions({
      disableAnimate: true,
      historyRoot: true
    });
    $ionicHistory.clearHistory();
    $state.go('tabs.home').then(function() {
      $ionicHistory.nextViewOptions({
        disableAnimate: true
      });
      $state.transitionTo('tabs.giftcards.amazon').then(function() {
        $state.transitionTo('tabs.giftcards.amazon.cards', {
          invoiceId: invoiceId
        });
      });
    });
  };
});
