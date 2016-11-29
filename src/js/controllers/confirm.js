'use strict';

angular.module('copayApp.controllers').controller('confirmController', function($rootScope, $scope, $interval, $filter, $timeout, $ionicScrollDelegate, gettextCatalog, walletService, platformInfo, lodash, configService, rateService, $stateParams, $window, $state, $log, profileService, bitcore, gettext, txFormatService, ongoingProcess, $ionicModal, popupService, $ionicHistory, $ionicConfig, payproService, feeService, amazonService) {
  var cachedTxp = {};
  var toAmount;
  var isChromeApp = platformInfo.isChromeApp;
  var countDown = null;
  var giftCardAmountUSD;
  var giftCardAccessKey;
  var giftCardInvoiceTime;
  var giftCardUUID;
  var cachedSendMax = {};
  $scope.isCordova = platformInfo.isCordova;
  $ionicConfig.views.swipeBackEnabled(false);

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    // Amazon.com Gift Card parameters
    $scope.isGiftCard = data.stateParams.isGiftCard;
    giftCardAmountUSD = data.stateParams.giftCardAmountUSD;
    giftCardAccessKey = data.stateParams.giftCardAccessKey;
    giftCardInvoiceTime = data.stateParams.giftCardInvoiceTime;
    giftCardUUID = data.stateParams.giftCardUUID;

    toAmount = data.stateParams.toAmount;
    cachedSendMax = {};
    $scope.useSendMax = data.stateParams.useSendMax == 'true' ? true : false;
    $scope.isWallet = data.stateParams.isWallet;
    $scope.cardId = data.stateParams.cardId;
    $scope.toAddress = data.stateParams.toAddress;
    $scope.toName = data.stateParams.toName;
    $scope.toEmail = data.stateParams.toEmail;
    $scope.description = data.stateParams.description;
    $scope.paypro = data.stateParams.paypro;
    $scope.insufficientFunds = false;
    $scope.noMatchingWallet = false;
    $scope.paymentExpired = {
      value: false
    };
    $scope.remainingTimeStr = {
      value: null
    };

    var config = configService.getSync().wallet;
    $scope.feeLevel = config.settings && config.settings.feeLevel ? config.settings.feeLevel : 'normal';
    $scope.network = (new bitcore.Address($scope.toAddress)).network.name;
    resetValues();
    setwallets();
  });

  function setwallets() {
    $scope.wallets = profileService.getWallets({
      onlyComplete: true,
      network: $scope.network,
      n: $scope.isGiftCard ? true : false
    });

    if (!$scope.wallets || !$scope.wallets.length) {
      $scope.noMatchingWallet = true;
      if ($scope.paypro) {
        displayValues();
      }
      $timeout(function() {
        $scope.$apply();
      });
      return;
    }

    var filteredWallets = [];
    var index = 0;
    var enoughFunds = false;

    lodash.each($scope.wallets, function(w) {
      walletService.getStatus(w, {}, function(err, status) {
        if (err || !status) {
          $log.error(err);
        } else {
          w.status = status;
          if (!status.availableBalanceSat) $log.debug('No balance available in: ' + w.name);
          if (status.availableBalanceSat > toAmount) {
            filteredWallets.push(w);
            enoughFunds = true;
          }
        }

        if (++index == $scope.wallets.length) {
          if (!lodash.isEmpty(filteredWallets)) {
            $scope.wallets = lodash.clone(filteredWallets);
            if ($scope.useSendMax) $scope.showWalletSelector();
            else initConfirm();
          } else {
            if (!enoughFunds) $scope.insufficientFunds = true;
            $log.warn('No wallet available to make the payment');
          }
          $timeout(function() {
            $scope.$apply();
          });
        }
      });
    });
  };

  var initConfirm = function() {
    if ($scope.paypro) _paymentTimeControl($scope.paypro.expires);

    displayValues();
    $scope.showWalletSelector();

    $timeout(function() {
      $scope.$apply();
    });
  };

  function displayValues() {
    toAmount = parseInt(toAmount);
    $scope.amountStr = txFormatService.formatAmountStr(toAmount);
    $scope.displayAmount = getDisplayAmount($scope.amountStr);
    $scope.displayUnit = getDisplayUnit($scope.amountStr);
    txFormatService.formatAlternativeStr(toAmount, function(v) {
      $scope.alternativeAmountStr = v;
    });
  };

  function resetValues() {
    $scope.displayAmount = $scope.displayUnit = $scope.fee = $scope.alternativeAmountStr = $scope.insufficientFunds = $scope.noMatchingWallet = null;
  };

  $scope.getSendMaxInfo = function() {
    resetValues();

    ongoingProcess.set('gettingFeeLevels', true);
    feeService.getCurrentFeeValue($scope.network, function(err, feePerKb) {
      ongoingProcess.set('gettingFeeLevels', false);
      if (err) {
        popupService.showAlert(gettextCatalog.getString('Error'), err.message);
        return;
      }
      var config = configService.getSync().wallet;

      ongoingProcess.set('retrievingInputs', true);
      walletService.getSendMaxInfo($scope.wallet, {
        feePerKb: feePerKb,
        excludeUnconfirmedUtxos: !config.spendUnconfirmed,
        returnInputs: true,
      }, function(err, resp) {
        ongoingProcess.set('retrievingInputs', false);
        if (err) {
          popupService.showAlert(gettextCatalog.getString('Error'), err);
          return;
        }

        if (resp.amount == 0) {
          $scope.insufficientFunds = true;
          popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Not enough funds for fee'));
          return;
        }

        $scope.sendMaxInfo = {
          sendMax: true,
          amount: resp.amount,
          inputs: resp.inputs,
          fee: resp.fee,
          feePerKb: feePerKb,
        };

        cachedSendMax[$scope.wallet.id] = $scope.sendMaxInfo;

        var msg = gettextCatalog.getString("{{fee}} will be deducted for bitcoin networking fees.", {
          fee: txFormatService.formatAmountStr(resp.fee)
        });
        var warningMsg = verifyExcludedUtxos();

        if (!lodash.isEmpty(warningMsg))
          msg += '\n' + warningMsg;

        popupService.showAlert(null, msg, function() {
          setSendMaxValues(resp);

          createTx($scope.wallet, true, function(err, txp) {
            if (err) return;
            cachedTxp[$scope.wallet.id] = txp;
            apply(txp);
          });
        });

        function verifyExcludedUtxos() {
          var warningMsg = [];
          if (resp.utxosBelowFee > 0) {
            warningMsg.push(gettextCatalog.getString("A total of {{amountBelowFeeStr}} were excluded. These funds come from UTXOs smaller than the network fee provided.", {
              amountBelowFeeStr: txFormatService.formatAmountStr(resp.amountBelowFee)
            }));
          }

          if (resp.utxosAboveMaxSize > 0) {
            warningMsg.push(gettextCatalog.getString("A total of {{amountAboveMaxSizeStr}} were excluded. The maximum size allowed for a transaction was exceeded.", {
              amountAboveMaxSizeStr: txFormatService.formatAmountStr(resp.amountAboveMaxSize)
            }));
          }
          return warningMsg.join('\n');
        };
      });
    });
  };

  function setSendMaxValues(data) {
    resetValues();
    var config = configService.getSync().wallet;
    var unitName = config.settings.unitName;
    var unitToSatoshi = config.settings.unitToSatoshi;
    var satToUnit = 1 / unitToSatoshi;
    var unitDecimals = config.settings.unitDecimals;

    $scope.displayAmount = txFormatService.formatAmount(data.amount, true);
    $scope.displayUnit = unitName;
    $scope.fee = txFormatService.formatAmountStr(data.fee);
    toAmount = parseFloat((data.amount * satToUnit).toFixed(unitDecimals));
    txFormatService.formatAlternativeStr(data.amount, function(v) {
      $scope.alternativeAmountStr = v;
    });
    $timeout(function() {
      $scope.$apply();
    });
  };

  $scope.$on('accepted', function(event) {
    $scope.approve();
  });

  $scope.showWalletSelector = function() {
    if (!$scope.useSendMax && ($scope.insufficientFunds || $scope.noMatchingWallet)) return;
    $scope.showWallets = true;
  };

  $scope.onWalletSelect = function(wallet) {
    if ($scope.useSendMax) {
      $scope.wallet = wallet;
      if (cachedSendMax[wallet.id]) {
        $log.debug('Send max cached for wallet:', wallet.id);
        setSendMaxValues(cachedSendMax[wallet.id]);
        return;
      }
      $scope.getSendMaxInfo();
    } else
      setWallet(wallet);
  };

  $scope.showDescriptionPopup = function() {
    var message = gettextCatalog.getString('Add description');
    var opts = {
      defaultText: $scope.description
    };

    popupService.showPrompt(null, message, opts, function(res) {
      if (typeof res != 'undefined') $scope.description = res;
      $timeout(function() {
        $scope.$apply();
      });
    });
  };

  function getDisplayAmount(amountStr) {
    return $scope.amountStr.split(' ')[0];
  };

  function getDisplayUnit(amountStr) {
    return $scope.amountStr.split(' ')[1];
  };

  function _paymentTimeControl(expirationTime) {
    $scope.paymentExpired.value = false;
    setExpirationTime();

    countDown = $interval(function() {
      setExpirationTime();
    }, 1000);

    function setExpirationTime() {
      var now = Math.floor(Date.now() / 1000);

      if (now > expirationTime) {
        setExpiredValues();
        return;
      }

      var totalSecs = expirationTime - now;
      var m = Math.floor(totalSecs / 60);
      var s = totalSecs % 60;
      $scope.remainingTimeStr.value = ('0' + m).slice(-2) + ":" + ('0' + s).slice(-2);
    };

    function setExpiredValues() {
      $scope.paymentExpired.value = true;
      $scope.remainingTimeStr.value = gettextCatalog.getString('Expired');
      if (countDown) $interval.cancel(countDown);
      $timeout(function() {
        $scope.$apply();
      });
    };
  };

  function setWallet(wallet, delayed) {
    var stop;
    $scope.wallet = wallet;
    $scope.fee = $scope.txp = null;

    if (stop) {
      $timeout.cancel(stop);
      stop = null;
    }

    if (cachedTxp[wallet.id]) {
      apply(cachedTxp[wallet.id]);
    } else {
      stop = $timeout(function() {
        createTx(wallet, true, function(err, txp) {
          if (err) return;
          cachedTxp[wallet.id] = txp;
          apply(txp);
        });
      }, delayed ? 2000 : 1);
    }

    $timeout(function() {
      $ionicScrollDelegate.resize();
      $scope.$apply();
    }, 10);
  };

  var setSendError = function(msg) {
    $scope.sendStatus = '';
    $timeout(function() {
      $scope.$apply();
    });
    popupService.showAlert(gettextCatalog.getString('Error at confirm'), msg);
  };

  function apply(txp) {
    $scope.fee = txFormatService.formatAmountStr(txp.fee);
    $scope.txp = txp;
    $timeout(function() {
      $scope.$apply();
    });
  };

  var createTx = function(wallet, dryRun, cb) {
    var config = configService.getSync().wallet;
    var currentSpendUnconfirmed = config.spendUnconfirmed;
    var paypro = $scope.paypro;
    var toAddress = $scope.toAddress;
    var description = $scope.description;
    var unitToSatoshi = config.settings.unitToSatoshi;
    var unitDecimals = config.settings.unitDecimals;

    // ToDo: use a credential's (or fc's) function for this
    if (description && !wallet.credentials.sharedEncryptingKey) {
      var msg = 'Could not add message to imported wallet without shared encrypting key';
      $log.warn(msg);
      return setSendError(msg);
    }

    if (toAmount > Number.MAX_SAFE_INTEGER) {
      var msg = 'Amount too big';
      $log.warn(msg);
      return setSendError(msg);
    }

    var txp = {};
    var amount;

    if ($scope.useSendMax) amount = parseFloat((toAmount * unitToSatoshi).toFixed(0));
    else amount = toAmount;

    txp.outputs = [{
      'toAddress': toAddress,
      'amount': amount,
      'message': description
    }];

    if ($scope.sendMaxInfo) {
      txp.inputs = $scope.sendMaxInfo.inputs;
      txp.fee = $scope.sendMaxInfo.fee;
    } else
      txp.feeLevel = config.settings && config.settings.feeLevel ? config.settings.feeLevel : 'normal';

    txp.message = description;

    if (paypro) {
      txp.payProUrl = paypro.url;
    }
    txp.excludeUnconfirmedUtxos = !currentSpendUnconfirmed;
    txp.dryRun = dryRun;

    walletService.createTx(wallet, txp, function(err, ctxp) {
      if (err) {
        setSendError(err);
        return cb(err);
      }
      return cb(null, ctxp);
    });
  };

  $scope.openPPModal = function() {
    $ionicModal.fromTemplateUrl('views/modals/paypro.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.payproModal = modal;
      $scope.payproModal.show();
    });
  };

  $scope.approve = function(onSendStatusChange) {
    if ($scope.paypro && $scope.paymentExpired.value) {
      popupService.showAlert(null, gettextCatalog.getString('This bitcoin payment request has expired.'));
      $scope.sendStatus = '';
      $timeout(function() {
        $scope.$apply();
      });
      return;
    }

    var wallet = $scope.wallet;
    if (!wallet) {
      return setSendError(gettextCatalog.getString('No wallet selected'));
    }

    if (!wallet.canSign() && !wallet.isPrivKeyExternal()) {
      $log.info('No signing proposal: No private key');

      return walletService.onlyPublish(wallet, txp, function(err, txp) {
        if (err) return setSendError(err);
      });
    }

    ongoingProcess.set('creatingTx', true, onSendStatusChange);
    createTx(wallet, false, function(err, txp) {
      ongoingProcess.set('creatingTx', false, onSendStatusChange);
      if (err) return;

      var config = configService.getSync();
      var spendingPassEnabled = walletService.isEncrypted(wallet);
      var touchIdEnabled = config.touchIdFor && config.touchIdFor[wallet.id];
      var isCordova = $scope.isCordova;
      var bigAmount = parseFloat(txFormatService.formatToUSD(txp.amount)) > 20;
      var message = gettextCatalog.getString('Sending {{amountStr}} from your {{name}} wallet', {
        amountStr: $scope.amountStr,
        name: wallet.name
      });
      var okText = gettextCatalog.getString('Confirm');
      var cancelText = gettextCatalog.getString('Cancel');

      if (!spendingPassEnabled && !touchIdEnabled) {
        if (isCordova) {
          if (bigAmount) {
            popupService.showConfirm(null, message, okText, cancelText, function(ok) {
              if (!ok) {
                $scope.sendStatus = '';
                $timeout(function() {
                  $scope.$apply();
                });
                return;
              }
              publishAndSign(wallet, txp, onSendStatusChange);
            });
          } else publishAndSign(wallet, txp, onSendStatusChange);
        } else {
          popupService.showConfirm(null, message, okText, cancelText, function(ok) {
            if (!ok) {
              $scope.sendStatus = '';
              return;
            }
            publishAndSign(wallet, txp, onSendStatusChange);
          });
        }
      } else publishAndSign(wallet, txp, onSendStatusChange);
    });
  };

  function statusChangeHandler(processName, showName, isOn) {
    $log.debug('statusChangeHandler: ', processName, showName, isOn);
    if ((processName === 'broadcastingTx' || ((processName === 'signingTx') && $scope.wallet.m > 1)) && !isOn) {
      $scope.sendStatus = 'success';
      $scope.$digest();
    } else if (showName) {
      $scope.sendStatus = showName;
    }
  };

  $scope.statusChangeHandler = statusChangeHandler;

  $scope.onConfirm = function() {
    $scope.approve(statusChangeHandler);
  };

  $scope.onSuccessConfirm = function() {
    var previousView = $ionicHistory.viewHistory().backView && $ionicHistory.viewHistory().backView.stateName;
    var fromBitPayCard = previousView.match(/tabs.bitpayCard/) ? true : false;
    var fromAmazon = previousView.match(/tabs.giftcards.amazon/) ? true : false;

    $ionicHistory.nextViewOptions({
      disableAnimate: true
    });
    $ionicHistory.removeBackView();
    $scope.sendStatus = '';

    if (fromBitPayCard) {
      $timeout(function() {
        $state.transitionTo('tabs.bitpayCard', {
          id: $stateParams.cardId
        });
      }, 100);
    } else if (fromAmazon) {
      $ionicHistory.nextViewOptions({
        disableAnimate: true,
        historyRoot: true
      });
      $ionicHistory.clearHistory();
      $state.go('tabs.home').then(function() {
        $state.transitionTo('tabs.giftcards.amazon', {
          cardClaimCode: $scope.amazonGiftCard ? $scope.amazonGiftCard.claimCode : null
        });
      });
    } else {
      $state.go('tabs.send');
    }
  };

  function publishAndSign(wallet, txp, onSendStatusChange) {
    walletService.publishAndSign(wallet, txp, function(err, txp) {
      if (err) return setSendError(err);

      var previousView = $ionicHistory.viewHistory().backView && $ionicHistory.viewHistory().backView.stateName;
      var fromAmazon = previousView.match(/tabs.giftcards.amazon/) ? true : false;
      if (fromAmazon) {
        var count = 0;
        var invoiceId = JSON.parse($scope.paypro.merchant_data).invoiceId;
        var dataSrc = {
          currency: 'USD',
          amount: giftCardAmountUSD,
          uuid: giftCardUUID,
          accessKey: giftCardAccessKey,
          invoiceId: invoiceId,
          invoiceUrl: $scope.paypro.url,
          invoiceTime: giftCardInvoiceTime
        };
        debounceCreate(count, dataSrc, onSendStatusChange);
      }
    }, onSendStatusChange);
  }

  var debounceCreate = lodash.throttle(function(count, dataSrc) {
    debounceCreateGiftCard(count, dataSrc);
  }, 8000, {
    'leading': true
  });

  var debounceCreateGiftCard = function(count, dataSrc, onSendStatusChange) {

    amazonService.createGiftCard(dataSrc, function(err, giftCard) {
      $log.debug("creating gift card " + count);
      if (err) {
        giftCard = {};
        giftCard.status = 'FAILURE';
        popupService.showAlert(gettextCatalog.getString('Error'), err);
      }

      if (giftCard.status == 'PENDING' && count < 3) {
        $log.debug("pending gift card not available yet");
        debounceCreate(count + 1, dataSrc);
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
          return;
        });
      }

      amazonService.savePendingGiftCard(newData, null, function(err) {
        $log.debug("Saving new gift card with status: " + newData.status);
        $scope.amazonGiftCard = newData;
      });
    });
  };
});
