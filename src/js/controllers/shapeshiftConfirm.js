'use strict';

angular.module('copayApp.controllers').controller('shapeshiftConfirmController', function($scope, $log, $state, $timeout, $ionicHistory, $ionicConfig, lodash, popupService, profileService, ongoingProcess, configService, walletService, bwcError, externalLinkService, platformInfo, gettextCatalog, txFormatService, shapeshiftService, bitcore, bitcoreCash) {

  var amount;
  var currency;
  var rateUnit;
  var fromWalletId;
  var toWalletId;
  var createdTx;
  var message;
  var configWallet = configService.getSync().wallet;
  $scope.currencyIsoCode = 'USD'; // Only USD
  $scope.isCordova = platformInfo.isCordova;

  $scope.openExternalLink = function(url) {
    externalLinkService.open(url);
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

  var publishAndSign = function(wallet, txp, onSendStatusChange, cb) {
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

  var statusChangeHandler = function(processName, showName, isOn) {
    $log.debug('statusChangeHandler: ', processName, showName, isOn);
    if (processName == 'sendingTx' && !isOn) {
      $scope.sendStatus = 'success';
      $timeout(function() {
        $scope.$digest();
      }, 100);
    } else if (showName) {
      $scope.sendStatus = showName;
    }
  };

  var satToFiat = function(coin, sat, isoCode, cb) {
    txFormatService.toFiat(coin, sat, isoCode, function(value) {
      return cb(value);
    });
  };

  var setFiatTotalAmount = function(amountSat, feeSat, withdrawalSat) {
    satToFiat($scope.toWallet.coin, withdrawalSat, $scope.currencyIsoCode, function(w) {
      $scope.fiatWithdrawal = Number(w);

      satToFiat($scope.fromWallet.coin, amountSat, $scope.currencyIsoCode, function(a) {
        $scope.fiatAmount = Number(a);

        satToFiat($scope.fromWallet.coin, feeSat, $scope.currencyIsoCode, function(i) {
          $scope.fiatFee = Number(i);

          $scope.fiatTotalAmount = $scope.fiatAmount + $scope.fiatFee;
          $timeout(function() { $scope.$digest(); }, 100);
        });
      });
    });
  };

  var saveShapeshiftData = function() {
    var address = $scope.shapeInfo.deposit;
    var withdrawal = $scope.shapeInfo.withdrawal;
    var status;
    var now = moment().unix() * 1000;

    shapeshiftService.getStatus(address, function(err, st) {
      var newData = {
        address: address,
        withdrawal: withdrawal,
        date: now,
        amount: $scope.amountStr,
        rate: rateUnit + ' ' + $scope.toWallet.coin.toUpperCase() + ' per ' + $scope.fromWallet.coin.toUpperCase(),
        title: $scope.fromWallet.coin.toUpperCase() + ' to ' + $scope.toWallet.coin.toUpperCase(),
        // From ShapeShift
        status: st.status,
        transaction: st.transaction || null, // Transaction ID of coin sent to withdrawal address
        incomingCoin: st.incomingCoin || null, // Amount deposited
        incomingType: st.incomingType || null, // Coin type of deposit
        outgoingCoin: st.outgoingCoin || null, // Amount sent to withdrawal address
        outgoingType: st.outgoingType || null, // Coin type of withdrawal
      };

      shapeshiftService.saveShapeshift(newData, null, function(err) {
        $log.debug("Saved shift with status: " + newData.status);
      });
    });
  };

  var createTx = function(wallet, toAddress, cb) {
    var parsedAmount = txFormatService.parseAmount(wallet.coin, amount, currency);
    $scope.amountUnitStr = parsedAmount.amountUnitStr;

    message = 'ShapeShift: ' + $scope.fromWallet.coin.toUpperCase() + ' to ' + $scope.toWallet.coin.toUpperCase();
    var outputs = [];

    outputs.push({
      'toAddress': toAddress,
      'amount': parsedAmount.amountSat,
      'message': message
    });

    var txp = {
      toAddress: toAddress,
      amount: parsedAmount.amountSat,
      outputs: outputs,
      message: message,
      excludeUnconfirmedUtxos: configWallet.spendUnconfirmed ? false : true,
      feeLevel: configWallet.settings.feeLevel || 'normal',
      customData: {
        'shapeShift': toAddress
      }
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

  var getLegacyAddressFormat = function(addr, coin) {
    if (coin == 'btc') return addr;
    var a = bitcoreCash.Address(addr).toObject();
    return bitcore.Address.fromObject(a).toString();
  };

  var getNewAddressFormat = function(addr, coin) {
    if (coin == 'btc') return addr;
    var a = bitcore.Address(addr).toObject();
    return bitcoreCash.Address.fromObject(a).toString();
  };

  var getCoinPair = function() {
    return $scope.fromWallet.coin + '_' + $scope.toWallet.coin;
  };

  var createShift = function() {
    ongoingProcess.set('connectingShapeshift', true);

    walletService.getAddress($scope.toWallet, false, function(err, withdrawalAddress) {
      if (err) {
        ongoingProcess.set('connectingShapeshift', false);
        showErrorAndBack('Could not get address');
        return;
      }
      withdrawalAddress = getLegacyAddressFormat(withdrawalAddress, $scope.toWallet.coin);

      walletService.getAddress($scope.fromWallet, false, function(err, returnAddress) {
        if (err) {
          ongoingProcess.set('connectingShapeshift', false);
          showErrorAndBack('Could not get address');
          return;
        }
        returnAddress = getLegacyAddressFormat(returnAddress, $scope.fromWallet.coin);

        var data = {
          withdrawal: withdrawalAddress,
          pair: getCoinPair(),
          returnAddress: returnAddress
        }
        shapeshiftService.shift(data, function(err, shapeData) {
          if (err || shapeData.error) {
            ongoingProcess.set('connectingShapeshift', false);
            showErrorAndBack(err || shapeData.error);
            return;
          }

          var toAddress = getNewAddressFormat(shapeData.deposit, $scope.fromWallet.coin);

          createTx($scope.fromWallet, toAddress, function(err, ctxp) {
            if (err) {
              ongoingProcess.set('connectingShapeshift', false);
              showErrorAndBack(err.title, err.message);
              return;
            }

            // Save in memory
            createdTx = ctxp;
            $scope.shapeInfo = shapeData;

            shapeshiftService.getRate(getCoinPair(), function(err, r) {
              ongoingProcess.set('connectingShapeshift', false);
              rateUnit = r.rate;
              var amountUnit = txFormatService.satToUnit(ctxp.amount);
              var withdrawalSat = Number((rateUnit * amountUnit * 100000000).toFixed());

              // Fee rate
              var per = (ctxp.fee / (ctxp.amount + ctxp.fee) * 100);
              $scope.feeRatePerStr = per.toFixed(2) + '%';

              // Amount + Unit
              $scope.amountStr = txFormatService.formatAmountStr($scope.fromWallet.coin, ctxp.amount);
              $scope.withdrawalStr = txFormatService.formatAmountStr($scope.toWallet.coin, withdrawalSat);
              $scope.feeStr = txFormatService.formatAmountStr($scope.fromWallet.coin, ctxp.fee);
              $scope.totalAmountStr = txFormatService.formatAmountStr($scope.fromWallet.coin, ctxp.amount + ctxp.fee);

              // Convert to fiat
              setFiatTotalAmount(ctxp.amount, ctxp.fee, withdrawalSat);
            });
          });
        });
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
    var useSendMax = data.stateParams.useSendMax == 'true' ? true : false;
    amount = data.stateParams.amount;
    currency = data.stateParams.currency;
    fromWalletId = data.stateParams.id;
    toWalletId = data.stateParams.toWalletId;

    $scope.network = shapeshiftService.getNetwork();
    $scope.fromWallet = profileService.getWallet(fromWalletId);
    $scope.toWallet = profileService.getWallet(toWalletId);

    if (lodash.isEmpty($scope.fromWallet) || lodash.isEmpty($scope.toWallet)) {
      showErrorAndBack(null, gettextCatalog.getString('No wallet found'));
      return;
    }

    shapeshiftService.getLimit(getCoinPair(), function(err, lim) {
      var min = Number(lim.min);
      var max = Number(lim.limit);

      if (useSendMax) amount = max;

      var amountNumber = Number(amount);
      if (amountNumber < min) {
        showErrorAndBack(null, gettextCatalog.getString('Minimum amount required is {{minAmount}}', {
          minAmount: min
        }));
        return;
      }
      if (amountNumber > max) {
        showErrorAndBack(null, gettextCatalog.getString('Maximum amount allowed is {{maxAmount}}', {
          maxAmount: max
        }));
        return;
      }
      createShift();
    });


  });

  $scope.confirmTx = function() {
    if (!createdTx) {
      showErrorAndBack(null, gettextCatalog.getString('Transaction has not been created'));
      return;
    }
    var title = gettextCatalog.getString('Confirm to shift {{fromCoin}} to {{toCoin}}', {
      fromCoin: $scope.fromWallet.coin.toUpperCase(),
      toCoin: $scope.toWallet.coin.toUpperCase()
    });
    var okText = gettextCatalog.getString('OK');
    var cancelText = gettextCatalog.getString('Cancel');
    popupService.showConfirm(title, '', okText, cancelText, function(ok) {
      if (!ok) {
        $scope.sendStatus = '';
        $timeout(function() {
          $scope.$apply();
        });
        return;
      }

      ongoingProcess.set('sendingTx', true, statusChangeHandler);
      publishAndSign($scope.fromWallet, createdTx, function() {}, function(err, txSent) {
        ongoingProcess.set('sendingTx', false, statusChangeHandler);
        if (err) {
          showErrorAndBack(gettextCatalog.getString('Could not send transaction'), err);
          return;
        }
        $scope.txSent = txSent;
        $timeout(function() { saveShapeshiftData(); }, 500);
        $timeout(function() { $scope.$digest(); }, 100);
      });
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
      $ionicHistory.nextViewOptions({
        disableAnimate: true
      });
      $state.transitionTo('tabs.shapeshift');
    });
  };
});
