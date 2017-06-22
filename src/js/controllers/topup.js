'use strict';

angular.module('copayApp.controllers').controller('topUpController', function($scope, $log, $state, $timeout, $ionicHistory, $ionicConfig, lodash, popupService, profileService, ongoingProcess, walletService, configService, platformInfo, bitpayService, bitpayCardService, payproService, bwcError, txFormatService, sendMaxService, gettextCatalog) {

  var dataSrc = {};
  var cardId;
  var sendMax;
  var configWallet = configService.getSync().wallet;

  var showErrorAndBack = function(title, msg) {
    title = title || gettextCatalog.getString('Error');
    $scope.sendStatus = '';
    $log.error(msg);
    msg = msg.errors ? msg.errors[0].message : msg;
    popupService.showAlert(title, msg, function() {
      $ionicHistory.goBack();
    });
  };

  var showError = function(title, msg) {
    title = title || gettextCatalog.getString('Error');
    $scope.sendStatus = '';
    $log.error(msg);
    msg = msg.errors ? msg.errors[0].message : msg;
    popupService.showAlert(title, msg);
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
    if ( processName == 'sendingTx' && !isOn) {
      $scope.sendStatus = 'success';
      $timeout(function() {
        $scope.$digest();
      }, 100);
    } else if (showName) {
      $scope.sendStatus = showName;
    }
  };

  var createInvoice = function() {
    $scope.expirationTime = null;
    ongoingProcess.set('creatingInvoice', true);
    bitpayCardService.topUp(cardId, dataSrc, function(err, invoiceId) {
      if (err) {
        ongoingProcess.set('creatingInvoice', false);
        showErrorAndBack(gettextCatalog.getString('Could not create the invoice'), err);
        return;
      }

      bitpayCardService.getInvoice(invoiceId, function(err, inv) {
        ongoingProcess.set('creatingInvoice', false);
        if (err) {
          showError(gettextCatalog.getString('Could not get the invoice'), err);
          return;
        }
        $scope.invoice = inv;
        $scope.expirationTime = ($scope.invoice.expirationTime - $scope.invoice.invoiceTime) / 1000;
        $timeout(function() {
          $scope.$digest();
        }, 1);
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
    $scope.wallet = null;
    $scope.isCordova = platformInfo.isCordova;

    cardId = data.stateParams.id;
    sendMax = data.stateParams.useSendMax;

    if (!cardId) {
      showErrorAndBack(null, gettextCatalog.getString('No card selected'));
      return;
    }

    var parsedAmount = txFormatService.parseAmount(
      data.stateParams.amount,
      data.stateParams.currency);

    dataSrc['amount'] = parsedAmount.amount;
    dataSrc['currency'] = parsedAmount.currency;
    $scope.amountUnitStr = parsedAmount.amountUnitStr;

    $scope.network = bitpayService.getEnvironment().network;
    $scope.wallets = profileService.getWallets({
      onlyComplete: true,
      network: $scope.network,
      hasFunds: true,
      minAmount: parsedAmount.amountSat
    });

    if (lodash.isEmpty($scope.wallets)) {
      showErrorAndBack(null, gettextCatalog.getString('Insufficient funds'));
      return;
    }
    $scope.onWalletSelect($scope.wallets[0]); // Default first wallet

    bitpayCardService.get({ cardId: cardId, noRefresh: true }, function(err, card) {
      if (err) {
        showErrorAndBack(null, err);
        return;
      }
      $scope.cardInfo = card[0];
      bitpayCardService.setCurrencySymbol($scope.cardInfo);
      bitpayCardService.getRates($scope.cardInfo.currency, function(err, data) {
        if (err) $log.error(err);
        $scope.rate = data.rate;
      });
    });

  });

  $scope.topUpConfirm = function() {
    var title;
    var message = gettextCatalog.getString("Top up {{amountStr}} to debit card ({{cardLastNumber}})", {
      amountStr: $scope.amountUnitStr,
      cardLastNumber: $scope.cardInfo.lastFourDigits
    });
    var okText = gettextCatalog.getString('Continue');
    var cancelText = gettextCatalog.getString('Cancel');
    popupService.showConfirm(title, message, okText, cancelText, function(ok) {
      if (!ok) return;

      ongoingProcess.set('topup', true, statusChangeHandler);

      var payProUrl = ($scope.invoice && $scope.invoice.paymentUrls) ? $scope.invoice.paymentUrls.BIP73 : null;

      if (!payProUrl) {
        ongoingProcess.set('topup', false, statusChangeHandler);
        showError(gettextCatalog.getString('Error in Payment Protocol'), gettextCatalog.getString('Invalid URL'));
        return;
      }

      payproService.getPayProDetails(payProUrl, function(err, payProDetails) {
        if (err) {
          ongoingProcess.set('topup', false, statusChangeHandler);
          showError(gettextCatalog.getString('Error fetching invoice'), err);
          return;
        }

        var outputs = [];
        var toAddress = payProDetails.toAddress;
        var amountSat = payProDetails.amount;

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

        walletService.createTx($scope.wallet, txp, function(err, ctxp) {
          if (err) {
            ongoingProcess.set('topup', false, statusChangeHandler);
            showError(gettextCatalog.getString('Could not create transaction'), bwcError.msg(err));
            return;
          }

          title = gettextCatalog.getString('Sending {{amountStr}} from {{walletName}}', {
            amountStr:  txFormatService.formatAmountStr(ctxp.amount, true),
            walletName: $scope.wallet.name
          });
          message = gettextCatalog.getString("{{fee}} will be deducted for bitcoin networking fees.", {
            fee: txFormatService.formatAmountStr(ctxp.fee)
          });
          okText = gettextCatalog.getString('Confirm');
          popupService.showConfirm(title, message, okText, cancelText, function(ok) {
            ongoingProcess.set('topup', false, statusChangeHandler);
            if (!ok) {
              $scope.sendStatus = '';
              return;
            }

            $scope.expirationTime = null; // Disable countdown
            ongoingProcess.set('sendingTx', true, statusChangeHandler);
            publishAndSign($scope.wallet, ctxp, function() {}, function(err, txSent) {
              ongoingProcess.set('sendingTx', false, statusChangeHandler);
              if (err) {
                showError(gettextCatalog.getString('Could not send transaction'), err);
                return;
              }
            });
          });
        });
      }, true); // Disable loader
    });
  };

  $scope.showWalletSelector = function() {
    $scope.walletSelectorTitle = 'From';
    $scope.showWallets = true;
  };

  $scope.onWalletSelect = function(wallet) {
    if ($scope.wallet && (wallet.id == $scope.wallet.id)) return;
    $scope.wallet = wallet;
    if (sendMax) {
      ongoingProcess.set('retrievingInputs', true);
      sendMaxService.getInfo($scope.wallet, function(err, values) {
        ongoingProcess.set('retrievingInputs', false);
        if (err) {
          showErrorAndBack(null, err);
          return;
        }
        var unitName = configWallet.settings.unitName;
        var amountUnit = txFormatService.satToUnit(values.amount);
        var parsedAmount = txFormatService.parseAmount(
          amountUnit,
          unitName);

        dataSrc['amount'] = parsedAmount.amount;
        dataSrc['currency'] = parsedAmount.currency;
        $scope.amountUnitStr = parsedAmount.amountUnitStr;
        createInvoice();
        $timeout(function() {
          $scope.$digest();
        }, 100);
      });
    } else {
      createInvoice();
    }
  };

  $scope.invoiceExpired = function() {
    $scope.sendStatus = '';
    showErrorAndBack(gettextCatalog.getString('Invoice Expired'), gettextCatalog.getString('This invoice has expired. An invoice is only valid for 15 minutes.'));
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
