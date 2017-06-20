'use strict';

angular.module('copayApp.controllers').controller('confirmController', function($rootScope, $scope, $interval, $filter, $timeout, $ionicScrollDelegate, gettextCatalog, walletService, platformInfo, lodash, configService, rateService, $stateParams, $window, $state, $log, profileService, bitcore, txFormatService, ongoingProcess, $ionicModal, popupService, $ionicHistory, $ionicConfig, payproService, feeService, bwcError) {

  var countDown = null;

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

  $scope.$on("$ionicView.beforeEnter", function(event, data) {

    function setWalletSelector(minAmount, cb) {
      console.log('[confirm.js.38:minAmount:]', minAmount); //TODO
      $scope.wallets = profileService.getWallets({
        onlyComplete: true,
        network: $scope.network
      });

      if (!$scope.wallets || !$scope.wallets.length) {
        $scope.noMatchingWallet = true;
        $log.warn('No ' + $scope.network + ' wallets to make the payment');
        $timeout(function() {
          $scope.$apply();
        });
        return;
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

            console.log('[confirm.js.68]', status.availableBalanceSat, minAmount); //TODO
            if (status.availableBalanceSat > minAmount) {
              filteredWallets.push(w);
            }
          }

          if (++index == $scope.wallets.length) {
            if (!walletsUpdated)
              return cb('Could not update any wallet');

            if (lodash.isEmpty(filteredWallets)) {
              $scope.insufficientFunds = true;
              $log.warn('No wallet available to make the payment');
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
    };


    // Other Scope vars
    $scope.isCordova = isCordova;
    $scope.showAddress = false;
    $scope.insufficientFunds = false;
    $scope.noMatchingWallet = false;
    $scope.paymentExpired = {
      value: false
    };
    $scope.remainingTimeStr = {
      value: null
    };


    $scope.walletSelectorTitle = gettextCatalog.getString('Send from');

    console.log('[confirm.js.126:tx:]', tx); //TODO

    setWalletSelector(tx.toAmount, function(err) {
      if (err) {
        $log.debug('Error updating wallets:' + err);
        popupService.showAlert(gettextCatalog.getString('Could not update wallets'), bwcError.msg(err), function() {
          $ionicHistory.nextViewOptions({
            disableAnimate: true,
            historyRoot: true
          });
          $ionicHistory.clearHistory();
          $state.go('tabs.send');
        });
      }

      $log.debug('Wallet selector is setup');

      if ($scope.wallets.length > 1) {
        $scope.showWalletSelector();
      } else {
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



  function updateTx(tx, wallet, cb) {

    // Amount
    tx.amountStr = txFormatService.formatAmountStr(tx.amount);
    tx.amountValueStr = $scope.amountStr.split(' ')[0];
    tx.amountUnitStr = $scope.amountStr.split(' ')[1];
    txFormatService.formatAlternativeStr(tx.amount, function(v) {
      tx.alternativeAmountStr = v;
    });

    $scope.tx = tx;


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

        getTxp(lodash.clone(tx), wallet, true, function(err, txp) {
          if (err) return cb(err);

          if (tx.sendMaxInfo)
            showSendMaxWarning(sendMaxInfo, function(err) {});

          tx.feeStr = txFormatService.formatAmountStr(txp.fee);
          txFormatService.formatAlternativeStr(txp.fee, function(v) {
            tx.alternativeFeeStr = v;
          });
          tx.feeRateStr = (txp.fee / (txp.amount + txp.fee) * 100).toFixed(2) + '%';

          tx.txp = tx.txp || [];
          tx.txp[wallet.id] = txp;

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


  function resetView() {
    $scope.displayAmount = $scope.displayUnit = $scope.fee = $scope.feeFiat = $scope.feeRateStr = $scope.alternativeAmountStr = $scope.insufficientFunds = $scope.noMatchingWallet = null;
    $scope.showAddress = false;

    console.log('[confirm.js.213] RESET'); //TODO
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
    resetView();
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

  // TODO 
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

    updateTx(tx, wallet, function(err) {
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

  $scope.approve = function(onSendStatusChange) {

    var wallet = $scope.wallet;
    if (!wallet) {
      return;
    }

    if ($scope.paypro && $scope.paymentExpired.value) {
      popupService.showAlert(null, gettextCatalog.getString('This bitcoin payment request has expired.'));
      $scope.sendStatus = '';
      $timeout(function() {
        $scope.$apply();
      });
      return;
    }

    ongoingProcess.set('creatingTx', true, onSendStatusChange);
    getTxp(wallet, false, function(err, txp) {
      ongoingProcess.set('creatingTx', false, onSendStatusChange);
      if (err) return;

      var spendingPassEnabled = walletService.isEncrypted(wallet);
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

  function publishAndSign(wallet, txp, onSendStatusChange) {

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

  $scope.chooseFeeLevel = function() {

    $scope.customFeeLevel = feeLevel;
    $ionicModal.fromTemplateUrl('views/modals/chooseFeeLevel.html', {
      scope: $scope,
    }).then(function(modal) {
      $scope.chooseFeeLevelModal = modal;
      $scope.openModal();
    });
    $scope.openModal = function() {
      $scope.chooseFeeLevelModal.show();
    };
    $scope.hideModal = function(customFeeLevel) {
      if (customFeeLevel) {
        ongoingProcess.set('gettingFeeLevels', true);
        setAndShowFee(customFeeLevel, function() {
          ongoingProcess.set('gettingFeeLevels', false);
          resetView();
          if ($scope.wallet)
            useSelectedWallet();
        })
      }
      $scope.chooseFeeLevelModal.hide();
    };
  };

});
