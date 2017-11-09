'use strict';

angular.module('copayApp.controllers').controller('confirmPrivateController', function($rootScope, $scope, $interval, $filter, $timeout, $ionicScrollDelegate, gettextCatalog, walletService, platformInfo, lodash, configService, rateService, $stateParams, $window, $state, $log, profileService, bitcore, txFormatService, ongoingProcess, $ionicModal, popupService, $ionicHistory, $ionicConfig, payproService, feeService, bwcError, navTechService) {

  var countDown = null;
  var CONFIRM_LIMIT_USD = 20;
  var FEE_TOO_HIGH_LIMIT_PER = 15;

  var tx = {};

  var time;

  // Config Related values
  var config = configService.getSync();
  var walletConfig = config.wallet;
  var unitToSatoshi = walletConfig.settings.unitToSatoshi;
  var unitDecimals = walletConfig.settings.unitDecimals;
  var satToUnit = 1 / unitToSatoshi;
  var configFeeLevel = walletConfig.settings.feeLevel ? walletConfig.settings.feeLevel : 'normal';


  // Platform info
  var isChromeApp = platformInfo.isChromeApp;
  var isCordova = platformInfo.isCordova;
  var isWindowsPhoneApp = platformInfo.isCordova && platformInfo.isWP;

  //custom fee flag
  var usingCustomFee = null;

  function refresh() {
    $timeout(function() {
      $scope.$apply();
    }, 1);
  }


  $scope.showWalletSelector = function() {
    $scope.walletSelector = true;
    refresh();
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
      $state.go('tabs.send', { address: undefined });
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

    $scope.setWalletSelector = function(network, minAmount, cb) {
      // no min amount? (sendMax) => look for no empty wallets
      minAmount = minAmount || 1;

      $scope.wallets = profileService.getWallets({
        onlyComplete: true,
        network: network
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
      time: Math.round(new Date().getTime() / 1000),
      txp: {},
    };

    //tx.amountStr = txFormatService.formatAmountStr(tx.toAmount);
    //tx.amountValueStr = tx.amountStr.split(' ')[0];
    //tx.amountUnitStr = tx.amountStr.split(' ')[1];
    //txFormatService.formatAlternativeStr(tx.toAmount, function(v) {
    //  tx.alternativeAmountStr = v;
    //});

    // Other Scope vars
    $scope.isCordova = isCordova;
    $scope.isWindowsPhoneApp = isWindowsPhoneApp;
    $scope.showAddress = false;

    var amount = parseInt(data.stateParams.toAmount);
    var address = data.stateParams.toAddress;

    if (tx.sendMax) {
      ongoingProcess.set('Calculating Transaction Fees', true);
      updateTx(tx, null, {}, function() {
        $scope.walletSelectorTitle = gettextCatalog.getString('Send from');
        $scope.setWalletSelector(tx.network, tx.toAmount, function(err) {
          if (err) {
            return exitWithError('Could not update wallets');
          }
          if ($scope.wallets.length > 1) {
            $scope.showWalletSelector();
            console.log('if scope.wallets > 1');
          } else if ($scope.wallets.length) {
            console.log('$scope.wallets.length');
            setWallet($scope.wallets[0], tx);
          }
        });
      }); //updateTx
    } else {
      $scope.tx = tx;
      ongoingProcess.set('Finding NavTech Server', true);
      navTechService.findNode(amount, address, $scope.foundNode);
    }
  });

  $scope.foundNode = function(success, data, serverInfo) {
    var tx = $scope.tx;
    ongoingProcess.set('Finding NavTech Server', false);
    if (!success) {
      //@TODO finish this tree
      setNoWallet('NavTech Error: ' + data.message);
      return;
    }

    $scope.navtechFeePercent = serverInfo.navtechFeePercent;

    //@TODO setup the multiple transactions with the right data
    var anonTxes = [];
    var sum = 0;
    for (var i=0; i<data.length; i++) {
      var txPart = lodash.clone(tx);
      txPart.toAmount = data[i].amount;
      txPart.toAddress = data[i].address;
      txPart.anondest = data[i].anonDestination;
      anonTxes.push(txPart);
      sum += data[i].amount;
    }

    $scope.originalAddress = tx.toAddress;

    $scope.anonTxes = anonTxes;
    tx.privatePayment = true;
    tx.toAddress = data[0].address;
    tx.anondest = data[0].anonDestination;

    if (tx.sendMax) {
      $scope.feeNavtech = tx.toAmount - Math.floor(tx.toAmount / (1 + (serverInfo.navtechFeePercent / 100)));
      var amountUnsafe = (tx.toAmount - $scope.feeNavtech) * satToUnit;
    } else {
      $scope.feeNavtech = Math.floor(tx.toAmount * (serverInfo.navtechFeePercent / 100));
      var amountUnsafe = tx.toAmount * satToUnit;
      tx.toAmount = Math.floor($scope.feeNavtech + tx.toAmount);
    }

    if ($scope.countDecimals(amountUnsafe) > 8) {
      $scope.amountStr = $filter('number')(amountUnsafe, 8);
    } else {
      $scope.amountStr = amountUnsafe;
    }

    $scope.feeNavtechDisplay = $filter('number')($scope.feeNavtech * satToUnit, 8) + ' ' + walletConfig.settings.unitName;

    updateTx(tx, null, {}, function() {

      $scope.walletSelectorTitle = gettextCatalog.getString('Send from');

      $scope.setWalletSelector(tx.network, tx.toAmount, function(err) {
        if (err) {
          return exitWithError('Could not update wallets');
        }

        if ($scope.wallets.length > 1) {
          $scope.showWalletSelector();
        } else if ($scope.wallets.length) {
          setWallet($scope.wallets[0], tx);
        }
      });

    }); //updateTx
  }

  $scope.countDecimals = function(number) {
    if(Math.floor(number.valueOf()) === number.valueOf()) return 0;
    return number.toString().split(".")[1].length || 0;
  }

  $scope.calculateTotal = function(tx) {
    if(!$scope.wallet || !tx || !tx.txp || !tx.txp[$scope.wallet.id]) return false;
    var txTotal = tx.toAmount + tx.txp[$scope.wallet.id].fee;
    var txTotalDisplay = txTotal * satToUnit + ' ' + walletConfig.settings.unitName;
    return txTotalDisplay;
  }

  function getFees() {
    var tx = $scope.tx;
    var wallet = $scope.wallet;
    feeService.getFeeRate(tx.network, tx.feeLevel, function(err, feeRate) {
      if (err) return setSendError(err);

      if (!usingCustomFee) tx.feeRate = feeRate;
      tx.feeLevelName = feeService.feeOpts[tx.feeLevel];
      if (!wallet) return setSendError(err);
      getSendMaxInfo(lodash.clone(tx), wallet, function(err, sendMaxInfo) {
        if (err) {
          console.log('getSendMaxInfo.err', err);
          var msg = gettextCatalog.getString('Error getting SendMax information');
          return setSendError(msg);
        }

        if (sendMaxInfo) {

          if (tx.sendMax && sendMaxInfo.amount == 0) {
            setNoWallet('Insufficent funds');
            popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Not enough funds for fee'));
            return cb('no_funds');
          }

          tx.sendMaxInfo = sendMaxInfo;
          tx.toAmount = tx.sendMaxInfo.amount;
          updateAmount();
          showSendMaxWarning(sendMaxInfo);
        }
        $scope.formattedAnonTxes = [];
        $scope.navtechTxFeeSatoshi = 0;
        getEachFee(0, function(err){
          ongoingProcess.set('Calculating Fees', false);
          if (err) {
            console.log('getEachFee.cb', err);
            return;
          }
          $scope.navtechFee = $scope.navtechFeeTemp;
          $scope.navtechTxFee = $scope.navtechTxFeeSatoshi * satToUnit + ' ' + walletConfig.settings.unitName;
        });
      });
    });
  }

  function getEachFee(i, cb) {
    var tx = $scope.anonTxes[i];
    var wallet = $scope.wallet;
    getTxp(lodash.clone(tx), wallet, true, function(err, txp) {
      if (err) return cb(err);

      txp.feeStr = txFormatService.formatAmountStr(txp.fee);
      txFormatService.formatAlternativeStr(txp.fee, function(v) {
        txp.alternativeFeeStr = v;
      });

      var per = (txp.fee / (txp.amount + txp.fee) * 100);
      txp.feeRatePerStr = per.toFixed(3) + '%';
      txp.feeToHigh = per > FEE_TOO_HIGH_LIMIT_PER;

      tx.txp[wallet.id] = txp;
      $log.debug('Confirm. TX Fully Updated for wallet:' + wallet.id, tx);
      refresh();
      $scope.navtechTxFeeSatoshi += tx.txp[wallet.id].fee;
      $scope.formattedAnonTxes[i] = tx;
      if (i < $scope.anonTxes.length - 1) {
        getEachFee(++i, cb);
      } else {
        cb(false);
      }
    });
  }

  function getSendMaxInfo(tx, wallet, cb) {
    if (!tx.sendMax) return cb();

    //ongoingProcess.set('retrievingInputs', true);
    walletService.getSendMaxInfo(wallet, {
      feePerKb: tx.feeRate,
      excludeUnconfirmedUtxos: !tx.spendUnconfirmed,
      returnInputs: true,
    }, cb);
  };


  function getTxp(tx, wallet, dryRun, cb) {

    // ToDo: use a credential's (or fc's) function for this
    if (tx.description && !wallet.credentials.sharedEncryptingKey) {
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

    txp.time = tx.time;

    txp.outputs = [{
      'toAddress': tx.toAddress,
      'amount': tx.toAmount,
      'message': tx.description
    }];

    txp.anondest = tx.anondest;

    if (tx.sendMaxInfo) {
      txp.inputs = tx.sendMaxInfo.inputs;
      txp.fee = tx.sendMaxInfo.fee;
    } else {
      if (usingCustomFee) {
        txp.feePerKb = tx.feeRate;
      } else txp.feeLevel = tx.feeLevel;
    }

    txp.feeNavtech = $scope.feeNavtech;
    txp.message = tx.description;

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

    function updateAmount() {
      if (!tx.toAmount) return;

      // Amount
      tx.amountStr = txFormatService.formatAmountStr(tx.toAmount);
      tx.amountValueStr = tx.amountStr.split(' ')[0];
      tx.amountUnitStr = tx.amountStr.split(' ')[1];
      txFormatService.formatAlternativeStr(tx.toAmount, function(v) {
        tx.alternativeAmountStr = v;
      });
    }

    updateAmount();
    refresh();

    // End of quick refresh, before wallet is selected.
    if (!wallet) return cb();

    feeService.getFeeRate(tx.network, tx.feeLevel, function(err, feeRate) {
      if (err) return cb(err);

      if (!usingCustomFee) tx.feeRate = feeRate;
      tx.feeLevelName = feeService.feeOpts[tx.feeLevel];

      if (!wallet)
        return cb();

      getSendMaxInfo(lodash.clone(tx), wallet, function(err, sendMaxInfo) {
        ongoingProcess.set('Calculating Transaction Fees', false);
        if (err) {
          var msg = gettextCatalog.getString('Error getting SendMax information');
          return setSendError(msg);
        }

        if (sendMaxInfo) {

          $log.debug('Send max info', sendMaxInfo);

          if (tx.sendMax && sendMaxInfo.amount == 0) {
            setNoWallet('Insufficent funds');
            popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Not enough funds for fee'));
            return cb('no_funds');
          }

          tx.sendMaxInfo = sendMaxInfo;
          tx.toAmount = tx.sendMaxInfo.amount;

          if (!tx.anondest) {
            $scope.tx = tx;
            ongoingProcess.set('Finding NavTech Server', true);
            navTechService.findNode(tx.toAmount, tx.toAddress, $scope.foundNode);
          }

          updateAmount();
          showSendMaxWarning(sendMaxInfo);
        }

        // txp already generated for this wallet?
        if (tx.txp[wallet.id]) {
          refresh();
          return cb();
        }

        getTxp(lodash.clone(tx), wallet, opts.dryRun, function(err, txp) {
          if (err) return cb(err);

          txp.feeStr = txFormatService.formatAmountStr(txp.fee);
          txFormatService.formatAlternativeStr(txp.fee, function(v) {
            txp.alternativeFeeStr = v;
          });

          txp.feeNavtechStr = txFormatService.formatAmountStr($scope.feeNavtech);
          txFormatService.formatAlternativeStr(txp.feeNavtech, function(v) {
            txp.alternativeFeeNavtechStr = v;
          });

          var per = ((txp.fee) / (txp.amount + txp.fee) * 100);
          txp.feeRatePerStr = per.toFixed(3) + '%';
          txp.feeToHigh = per > FEE_TOO_HIGH_LIMIT_PER;

          tx.txp[wallet.id] = txp;
          $log.debug('Confirm. TX Fully Updated for wallet:' + wallet.id, tx);
          refresh();

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
    $scope.buttonText = gettextCatalog.getString(isCordova && !isWindowsPhoneApp ? 'Slide' : 'Click') + ' ';

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

    var msg = gettextCatalog.getString("{{fee}} will be deducted for Nav Coin networking fees.", {
      fee: txFormatService.formatAmountStr(sendMaxInfo.fee)
    });
    var warningMsg = verifyExcludedUtxos();

    if (!lodash.isEmpty(warningMsg))
      msg += '\n' + warningMsg;

    // popupService.showAlert(null, msg, function() {});
  };

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
    $scope.paymentExpired = false;
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
      $scope.remainingTimeStr = ('0' + m).slice(-2) + ":" + ('0' + s).slice(-2);
    };

    function setExpiredValues() {
      $scope.paymentExpired = true;
      $scope.remainingTimeStr = gettextCatalog.getString('Expired');
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

    if (tx.paypro)
      _paymentTimeControl(tx.paypro.expires);

    updateTx(tx, wallet, {
      dryRun: true
    }, function(err) {
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

    if ($scope.paymentExpired) {
      popupService.showAlert(null, gettextCatalog.getString('This Nav Coin payment request has expired.'));
      $scope.sendStatus = '';
      $timeout(function() {
        $scope.$apply();
      });
      return;
    }

    ongoingProcess.set('creatingTx', true, onSendStatusChange);
    console.log("approve tx = "+tx.time + " - " + tx);
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

  function publishEach(wallet, i) {
    var tx = $scope.formattedAnonTxes[i];

    getTxp(lodash.clone(tx), wallet, false, function(err, txp) {
      if (err) return;
      txp.message = $scope.tx.message;

      function publishAndSign() {
        if (!wallet.canSign() && !wallet.isPrivKeyExternal()) {
          $log.info('No signing proposal: No private key');

          return walletService.onlyPublish(wallet, txp, function(err) {
            if (err) setSendError(err);
            if (i < $scope.formattedAnonTxes.length - 1) {
              publishEach(wallet, ++i);
            }
          }, onSendStatusChange);
        }

        walletService.publishAndSign(wallet, txp, function(err, txp) {
          if (err) return setSendError(err);
          if (i < $scope.formattedAnonTxes.length - 1) {
            publishEach(wallet, ++i);
          }
        }, onSendStatusChange);
      };
    });
  }

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

  $scope.onSuccessConfirm = function() {
    $scope.sendStatus = '';
    $ionicHistory.nextViewOptions({
      disableAnimate: true,
      historyRoot: true
    });
    $state.go('tabs.send').then(function() {
      $ionicHistory.clearHistory();
      $state.transitionTo('tabs.home');
    });
  };

  $scope.chooseFeeLevel = function(tx, wallet) {

    var scope = $rootScope.$new(true);
    scope.network = tx.network;
    scope.feeLevel = tx.feeLevel;
    scope.noSave = true;

    if (usingCustomFee) {
      scope.customFeePerKB = tx.feeRate;
      scope.feePerSatByte = (tx.feeRate / 1000).toFixed();
    }

    $ionicModal.fromTemplateUrl('views/modals/chooseFeeLevel.html', {
      scope: scope,
      backdropClickToClose: false,
      hardwareBackButtonClose: false
    }).then(function(modal) {
      scope.chooseFeeLevelModal = modal;
      scope.openModal();
    });
    scope.openModal = function() {
      scope.chooseFeeLevelModal.show();
    };

    scope.hideModal = function(newFeeLevel, customFeePerKB) {
      scope.chooseFeeLevelModal.hide();
      $log.debug('New fee level choosen:' + newFeeLevel + ' was:' + tx.feeLevel);

      usingCustomFee = newFeeLevel == 'custom' ? true : false;

      if (tx.feeLevel == newFeeLevel && !usingCustomFee) return;

      tx.feeLevel = newFeeLevel;
      if (usingCustomFee) tx.feeRate = parseInt(customFeePerKB);

      updateTx(tx, wallet, {
        clearCache: true,
        dryRun: true
      }, function() {});
    };
  };

});
