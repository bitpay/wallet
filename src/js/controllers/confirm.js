'use strict';

angular.module('copayApp.controllers').controller('confirmController', function($rootScope, $scope, $interval, $filter, $timeout, $ionicScrollDelegate, gettextCatalog, walletService, platformInfo, lodash, configService, rateService, $stateParams, $window, $state, $log, profileService, bitcore, txFormatService, ongoingProcess, $ionicModal, popupService, $ionicHistory, $ionicConfig, payproService, feeService, bwcError) {

  var countDown = null;
  var CONFIRM_LIMIT_USD = 20;

  var tx = {};

  // Config Related values
  var config = configService.getSync();
  var walletConfig = config.wallet;
  var unitToSatoshi = walletConfig.settings.unitToSatoshi;
  var unitDecimals = walletConfig.settings.unitDecimals;
  var satToUnit = 1 / unitToSatoshi;
  var touchIdEnabled = config.touchIdFor && config.touchIdFor[wallet.id];
  var configFeeLevel = walletConfig.settings.feeLevel ? walletConfig.settings.feeLevel : 'normal';


  // Platform info
  var isChromeApp = platformInfo.isChromeApp;
  var isCordova = platformInfo.isCordova;


  $scope.showWalletSelector = function() {
    $scope.walletSelector = true;
  };

  $scope.$on("$ionicView.beforeLeave", function(event, data) {
    $ionicConfig.views.swipeBackEnabled(true);
  });

  $scope.$on("$ionicView.enter", function(event, data) {
    $ionicConfig.views.swipeBackEnabled(false);
  });


  function exitWithError(err) {
    $log.info('Error setting wallet selector:' + err);
    popupService.showAlert(gettextCatalog.getString(), bwcError.msg(err), function() {
      $ionicHistory.nextViewOptions({
        disableAnimate: true,
        historyRoot: true
      });
      $ionicHistory.clearHistory();
      $state.go('tabs.send');
    });
  };

  function setNoWallet(msg) {
    $scope.wallet = null;
    $scope.noWalletMessage = gettextCatalog.getString(msg);
    $log.warn('Not ready to make the payment:' + msg);
    $timeout(function() {
      $scope.$apply();
    });
  };

  $scope.$on("$ionicView.beforeEnter", function(event, data) {

    function setWalletSelector(minAmount, cb) {
      console.log('[confirm.js.38:minAmount:]', minAmount); //TODO
      $scope.wallets = profileService.getWallets({
        onlyComplete: true,
        network: $scope.network
      });

      if (!$scope.wallets || !$scope.wallets.length) {
        setNoWallet('No wallets available');
        return cb();
      }

      var filteredWallets = [];
      var index = 0;
      var walletsUpdated = 0;

      lodash.each($scope.wallets, function(w) {
        walletService.getStatus(w, {}, function(err, status) {
          if (err || !status) {
            $log.error(err);
          } else {
            walletsUpdated++;
            w.status = status;

            if (!status.availableBalanceSat)
              $log.debug('No balance available in: ' + w.name);

            if (status.availableBalanceSat > minAmount) {
              filteredWallets.push(w);
            }
          }

          if (++index == $scope.wallets.length) {
            if (!walletsUpdated)
              return cb('Could not update any wallet');

            if (lodash.isEmpty(filteredWallets)) {
              setNoWallet('Insufficent funds');
            }
            $scope.wallets = lodash.clone(filteredWallets);
            return cb();
          }
        });
      });
    };

    // Setup $scope

    // Grab stateParams
    tx = {
      toAmount: parseInt(data.stateParams.toAmount),
      sendMax: data.stateParams.useSendMax == 'true' ? true : false,
      toAddress: data.stateParams.toAddress,
      description: data.stateParams.description,
      paypro: data.stateParams.paypro,

      feeLevel: configFeeLevel,
      spendUnconfirmed: walletConfig.spendUnconfirmed,

      // Vanity tx info (not in the real tx)
      recipientType: data.stateParams.recipientType || null,
      toName: data.stateParams.toName,
      toEmail: data.stateParams.toEmail,
      toColor: data.stateParams.toColor,
      network: (new bitcore.Address(data.stateParams.toAddress)).network.name,
      txp: {},
    };


    // Other Scope vars
    $scope.isCordova = isCordova;
    $scope.showAddress = false;
    $scope.insufficientFunds = false;
    $scope.paymentExpired = {
      value: false
    };
    $scope.remainingTimeStr = {
      value: null
    };

    $scope.walletSelectorTitle = gettextCatalog.getString('Send from');

    setWalletSelector(tx.toAmount, function(err) {
      if (err) {
        return exitWithError('Could not update wallets');
      }

      if ($scope.wallets.length > 1) {
        $scope.showWalletSelector();
      } else if ($scope.wallets.length) {
        setWallet($scope.wallets[0], tx);
      }
    });
  });


  function getSendMaxInfo(tx, cb) {
    if (!tx.sendMax) return cb();

    //ongoingProcess.set('retrievingInputs', true);
    walletService.getSendMaxInfo(wallet, {
      feePerKb: tx.feeRate,
      excludeUnconfirmedUtxos: !tx.spendUnconfirmed,
      returnInputs: true,
    }, cb);
  };


  function getTxp(tx, wallet, dryRun, cb) {

    var paypro = tx.paypro;
    var toAddress = tx.toAddress;
    var description = tx.description;

    // ToDo: use a credential's (or fc's) function for this
    if (description && !wallet.credentials.sharedEncryptingKey) {
      var msg = gettextCatalog.getString('Could not add message to imported wallet without shared encrypting key');
      $log.warn(msg);
      return setSendError(msg);
    }

    if (tx.toAmount > Number.MAX_SAFE_INTEGER) {
      var msg = gettextCatalog.getString('Amount too big');
      $log.warn(msg);
      return setSendError(msg);
    }

    var txp = {};

    txp.outputs = [{
      'toAddress': tx.toAddress,
      'amount': tx.toAmount,
      'message': tx.description
    }];

    if (tx.sendMaxInfo) {
      txp.inputs = tx.sendMaxInfo.inputs;
      txp.fee = tx.sendMaxInfo.fee;
    } else {
      txp.feeLevel = tx.feeLevel;
    }

    txp.message = description;

    if (tx.paypro) {
      txp.payProUrl = tx.paypro.url;
    }
    txp.excludeUnconfirmedUtxos = !tx.spendUnconfirmed;
    txp.dryRun = dryRun;
    walletService.createTx(wallet, txp, function(err, ctxp) {
      if (err) {
        setSendError(err);
        return cb(err);
      }
      return cb(null, ctxp);
    });
  };

  function updateTx(tx, wallet, opts, cb) {

    if (opts.clearCache) {
      tx.txp = {};
    }

    $scope.tx = tx;

    // Amount
    tx.amountStr = txFormatService.formatAmountStr(tx.toAmount);
    console.log('[confirm.js.217:tx:]', tx); //TODO
    tx.amountValueStr = tx.amountStr.split(' ')[0];
    tx.amountUnitStr = tx.amountStr.split(' ')[1];
    txFormatService.formatAlternativeStr(tx.toAmount, function(v) {
      tx.alternativeAmountStr = v;
    });


    // inmediate refresh of know values
    $timeout(function() {
      $scope.$apply();
    }, 1);

    feeService.getFeeRate(tx.network, tx.feeLevel, function(err, feeRate) {
      if (err) return cb(err);

      tx.feeRate = feeRate;
      tx.feeLevelName = feeService.feeOpts[tx.feeLevel];

      getSendMaxInfo(lodash.clone(tx), function(err, sendMaxInfo) {
        if (err) {
          var msg = gettextCatalog.getString('Error getting SendMax information');
          return setSendError(msg);
        }

        if (sendMaxInfo) {
          if (tx.sendMax && tx.sendMaxInfo.amount == 0) {
            $scope.insufficientFunds = true;
            popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Not enough funds for fee'));
            return cb('no_funds');
          }

          tx.sendMaxInfo = resp;
          tx.toAmount = parseFloat((tx.sendMaxInfo.amount * unitToSatoshi).toFixed(0));
        }



        // txp already generated for this wallet?
        if (tx.txp[wallet.id])
          return cb();

        getTxp(lodash.clone(tx), wallet, opts.dryRun, function(err, txp) {
          if (err) return cb(err);

          if (tx.sendMaxInfo)
            showSendMaxWarning(sendMaxInfo, function(err) {});


          txp.feeStr = txFormatService.formatAmountStr(txp.fee);
          txFormatService.formatAlternativeStr(txp.fee, function(v) {
            txp.alternativeFeeStr = v;
          });
          txp.feeRatePerStr = (txp.fee / (txp.amount + txp.fee) * 100).toFixed(2) + '%';


          tx.txp[wallet.id] = txp;
          $log.debug('Confirm. TX Fully Updated for wallet:' + wallet.id, tx);

          return cb();
        });
      });
    });
  }

  function useSelectedWallet() {

    if (!$scope.useSendMax) {
      showAmount(tx.toAmount);
    }

    $scope.onWalletSelect($scope.wallet);
  }

  function setButtonText(isMultisig, isPayPro) {
    $scope.buttonText = gettextCatalog.getString(isCordova ? 'Slide' : 'Click') + ' ';

    if (isPayPro) {
      $scope.buttonText += gettextCatalog.getString('to pay');
    } else if (isMultisig) {
      $scope.buttonText += gettextCatalog.getString('to accept');
    } else
      $scope.buttonText += gettextCatalog.getString('to send');
  };


  $scope.toggleAddress = function() {
    $scope.showAddress = !$scope.showAddress;
  };


  function showSendMaxWarning(sendMaxInfo) {

    function verifyExcludedUtxos() {
      var warningMsg = [];
      if (sendMaxInfo.utxosBelowFee > 0) {
        warningMsg.push(gettextCatalog.getString("A total of {{amountBelowFeeStr}} were excluded. These funds come from UTXOs smaller than the network fee provided.", {
          amountBelowFeeStr: txFormatService.formatAmountStr(sendMaxInfo.amountBelowFee)
        }));
      }

      if (sendMaxInfo.utxosAboveMaxSize > 0) {
        warningMsg.push(gettextCatalog.getString("A total of {{amountAboveMaxSizeStr}} were excluded. The maximum size allowed for a transaction was exceeded.", {
          amountAboveMaxSizeStr: txFormatService.formatAmountStr(sendMaxInfo.amountAboveMaxSize)
        }));
      }
      return warningMsg.join('\n');
    };

    var msg = gettextCatalog.getString("{{fee}} will be deducted for bitcoin networking fees.", {
      fee: txFormatService.formatAmountStr(sendMaxInfo.fee)
    });
    var warningMsg = verifyExcludedUtxos();

    if (!lodash.isEmpty(warningMsg))
      msg += '\n' + warningMsg;

    popupService.showAlert(null, msg, function() {});
  };

  function setSendMaxValues(data) {
    $scope.amountStr = txFormatService.formatAmountStr(data.amount, true);
    $scope.displayAmount = getDisplayAmount($scope.amountStr);
    $scope.displayUnit = getDisplayUnit($scope.amountStr);
    $scope.fee = txFormatService.formatAmountStr(data.fee);
    txFormatService.formatAlternativeStr(data.fee, function(v) {
      $scope.feeFiat = v;
    });
    toAmount = parseFloat((data.amount * satToUnit).toFixed(unitDecimals));
    txFormatService.formatAlternativeStr(data.amount, function(v) {
      $scope.alternativeAmountStr = v;
    });
    $scope.feeRateStr = (data.fee / (data.amount + data.fee) * 100).toFixed(2) + '%';
    $timeout(function() {
      $scope.$apply();
    });
  };

  $scope.$on('accepted', function(event) {
    $scope.approve();
  });

  $scope.onWalletSelect = function(wallet) {
    setWallet(wallet, tx);
  };

  $scope.showDescriptionPopup = function(tx) {
    var message = gettextCatalog.getString('Add description');
    var opts = {
      defaultText: tx.description
    };

    popupService.showPrompt(null, message, opts, function(res) {
      if (typeof res != 'undefined') tx.description = res;
      $timeout(function() {
        $scope.$apply();
      });
    });
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

  /* sets a wallet on the UI, creates a TXPs for that wallet */

  function setWallet(wallet, tx) {

    $scope.wallet = wallet;

    setButtonText(wallet.credentials.m > 1, !!tx.paypro);

    //T TODO
    if ($scope.paypro)
      _paymentTimeControl($scope.paypro.expires);

    updateTx(tx, wallet, {
      dryRun: true
    }, function(err) {
      if (err) return;

      $timeout(function() {
        $ionicScrollDelegate.resize();
        $scope.$apply();
      }, 10);

    });

  };

  var setSendError = function(msg) {
    $scope.sendStatus = '';
    $timeout(function() {
      $scope.$apply();
    });
    popupService.showAlert(gettextCatalog.getString('Error at confirm'), bwcError.msg(msg));
  };

  $scope.openPPModal = function() {
    $ionicModal.fromTemplateUrl('views/modals/paypro.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.payproModal = modal;
      $scope.payproModal.show();
    });
  };

  $scope.cancel = function() {
    $scope.payproModal.hide();
  };

  $scope.approve = function(tx, wallet, onSendStatusChange) {

    if (!tx || !wallet) return;

    // TODO
    if (tx.paypro && $scope.paymentExpired.value) {
      popupService.showAlert(null, gettextCatalog.getString('This bitcoin payment request has expired.'));
      $scope.sendStatus = '';
      $timeout(function() {
        $scope.$apply();
      });
      return;
    }

    ongoingProcess.set('creatingTx', true, onSendStatusChange);
    getTxp(lodash.clone(tx), wallet, false, function(err, txp) {
      ongoingProcess.set('creatingTx', false, onSendStatusChange);
      if (err) return;

      // confirm txs for more that 20usd, if not spending/touchid is enabled
      function confirmTx(cb) {
        if (walletService.isEncrypted(wallet))
          return cb();

        var amountUsd = parseFloat(txFormatService.formatToUSD(txp.amount));
        if (amountUsd <= CONFIRM_LIMIT_USD)
          return cb();

        var message = gettextCatalog.getString('Sending {{amountStr}} from your {{name}} wallet', {
          amountStr: tx.amountStr,
          name: wallet.name
        });
        var okText = gettextCatalog.getString('Confirm');
        var cancelText = gettextCatalog.getString('Cancel');
        popupService.showConfirm(null, message, okText, cancelText, function(ok) {
          return cb(!ok);
        });
      };

      function publishAndSign() {
        if (!wallet.canSign() && !wallet.isPrivKeyExternal()) {
          $log.info('No signing proposal: No private key');

          return walletService.onlyPublish(wallet, txp, function(err) {
            if (err) setSendError(err);
          }, onSendStatusChange);
        }

        walletService.publishAndSign(wallet, txp, function(err, txp) {
          if (err) return setSendError(err);
        }, onSendStatusChange);
      };

      confirmTx(function(nok) {
        if (nok) {
          $scope.sendStatus = '';
          $timeout(function() {
            $scope.$apply();
          });
          return;
        }
        publishAndSign();
      });
    });
  };

  function statusChangeHandler(processName, showName, isOn) {
    $log.debug('statusChangeHandler: ', processName, showName, isOn);
    if (
      (
        processName === 'broadcastingTx' ||
        ((processName === 'signingTx') && $scope.wallet.m > 1) ||
        (processName == 'sendingTx' && !$scope.wallet.canSign() && !$scope.wallet.isPrivKeyExternal())
      ) && !isOn) {
      $scope.sendStatus = 'success';
      $timeout(function() {
        $scope.$digest();
      }, 100);
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

    $ionicHistory.nextViewOptions({
      disableAnimate: true
    });
    $ionicHistory.removeBackView();
    $scope.sendStatus = '';

    $ionicHistory.nextViewOptions({
      disableAnimate: true,
      historyRoot: true
    });
    $ionicHistory.clearHistory();
    $state.go('tabs.send').then(function() {
      $state.transitionTo('tabs.home');
    });
  };

  $scope.chooseFeeLevel = function(tx, wallet) {


    var scope = $rootScope.$new(true);
    scope.network = tx.network;
    scope.feeLevel = tx.feeLevel;
    scope.noSave = true;

    $ionicModal.fromTemplateUrl('views/modals/chooseFeeLevel.html', {
      scope: scope,
    }).then(function(modal) {
      scope.chooseFeeLevelModal = modal;
      scope.openModal();
    });
    scope.openModal = function() {
      scope.chooseFeeLevelModal.show();
    };

    scope.hideModal = function(customFeeLevel) {
      $log.debug('Custom fee level choosen:' + customFeeLevel + ' was:' + tx.feeLevel);
      if (tx.feeLevel == customFeeLevel)
        scope.chooseFeeLevelModal.hide();

      tx.feeLevel = customFeeLevel;
      updateTx(tx, wallet, {
        clearCache: true,
        dryRun: true,
      }, function() {
        scope.chooseFeeLevelModal.hide();
      });
    };
  };

});
