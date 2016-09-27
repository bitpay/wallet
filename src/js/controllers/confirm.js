'use strict';

angular.module('copayApp.controllers').controller('confirmController', function($rootScope, $scope, $filter, $timeout, $ionicScrollDelegate, gettextCatalog, walletService, platformInfo, lodash, configService, rateService, $stateParams, $window, $state, $log, profileService, bitcore, gettext, txFormatService, ongoingProcess, $ionicModal, popupService) {
  var cachedTxp = {};
  var isChromeApp = platformInfo.isChromeApp;

  $scope.isWallet = $stateParams.isWallet;
  $scope.toAmount = $stateParams.toAmount;
  $scope.toAddress = $stateParams.toAddress;
  $scope.toName = $stateParams.toName;
  $scope.toEmail = $stateParams.toEmail;
  $scope.description = $stateParams.description;
  $scope.paypro = $stateParams.paypro;

  $scope.$on("$ionicView.enter", function(event, data) {
    initConfirm();
  });

  var initConfirm = function() {
    if ($scope.paypro) {
      return setFromPayPro($scope.paypro, function(err) {
        if (err && !isChromeApp) {
          popupService.showAlert(gettext('Could not fetch payment'));
        }
      });
    }
    // TODO (URL , etc)
    if (!$scope.toAddress || !$scope.toAmount) {
      $log.error('Bad params at amount')
      throw ('bad params');
    }
    $scope.isCordova = platformInfo.isCordova;
    $scope.data = {};

    var config = configService.getSync().wallet;
    $scope.feeLevel = config.settings ? config.settings.feeLevel : '';

    $scope.toAmount = parseInt($scope.toAmount);
    $scope.amountStr = txFormatService.formatAmountStr($scope.toAmount);

    var networkName = (new bitcore.Address($scope.toAddress)).network.name;
    $scope.network = networkName;

    $scope.notAvailable = false;
    var wallets = profileService.getWallets({
      onlyComplete: true,
      network: networkName,
    });

    var filteredWallets = [];
    var index = 0;

    lodash.each(wallets, function(w) {
      walletService.getStatus(w, {}, function(err, status) {
        if (err || !status) {
          $log.error(err);
        } else {
          if (!status.availableBalanceSat) $log.debug('No balance available in: ' + w.name);
          if (status.availableBalanceSat > $scope.toAmount) filteredWallets.push(w);
        }

        if (++index == wallets.length) {
          if (!lodash.isEmpty(filteredWallets)) {
            $scope.wallets = lodash.clone(filteredWallets);
            $scope.notAvailable = false;
          } else {
            $scope.notAvailable = true;
            $log.warn('No wallet available to make the payment');
          }
        }
      });
    });

    txFormatService.formatAlternativeStr($scope.toAmount, function(v) {
      $scope.alternativeAmountStr = v;
    });

    $timeout(function() {
      $scope.$apply();
    }, 100);
  };

  $scope.$on('accepted', function(event) {
    $scope.approve();
  });

  $scope.$on('Wallet/Changed', function(event, wallet) {
    if (lodash.isEmpty(wallet)) {
      $log.debug('No wallet provided');
      return;
    }
    $log.debug('Wallet changed: ' + wallet.name);
    setWallet(wallet, true);
  });


  $scope.showDescriptionPopup = function() {
    var message = gettextCatalog.getString('Add description');
    var opts = {
      defaultText: $scope.description
    };

    popupService.showPrompt(null, message, opts, function(res) {
      if (res) $scope.description = res;
      $timeout(function() {
        $scope.$apply();
      }, 100);
    });
  };

  var setFromPayPro = function(uri, cb) {
    if (!cb) cb = function() {};

    var wallet = profileService.getWallets({
      onlyComplete: true
    })[0];

    if (!wallet) return cb();

    if (isChromeApp) {
      popupService.showAlert(gettextCatalog.getString('Payment Protocol not supported on Chrome App'));
      return cb(true);
    }

    $log.debug('Fetch PayPro Request...', uri);

    ongoingProcess.set('fetchingPayPro', true);
    wallet.fetchPayPro({
      payProUrl: uri,
    }, function(err, paypro) {

      ongoingProcess.set('fetchingPayPro', false);

      if (err) {
        $log.warn('Could not fetch payment request:', err);
        var msg = err.toString();
        if (msg.match('HTTP')) {
          msg = gettextCatalog.getString('Could not fetch payment information');
        }
        popupService.showAlert(msg);
        return cb(true);
      }

      if (!paypro.verified) {
        $log.warn('Failed to verify payment protocol signatures');
        popupService.showAlert(gettextCatalog.getString('Payment Protocol Invalid'));
        return cb(true);
      }

      $scope.toAmount = paypro.amount;
      $scope.toAddress = paypro.toAddress;
      $scope.description = paypro.memo;
      $scope.paypro = null;

      $scope._paypro = paypro;

      return initConfirm();
    });
  };

  function setWallet(wallet, delayed) {
    var stop;
    $scope.wallet = wallet;
    $scope.fee = $scope.txp = null;

    $timeout(function() {
      $ionicScrollDelegate.resize();
      $scope.$apply();
    }, 10);

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
  };

  var setSendError = function(msg) {
    popupService.showAlert(gettextCatalog.getString('Error at confirm:'), msg);
  };

  function apply(txp) {
    $scope.fee = txFormatService.formatAmountStr(txp.fee);
    $scope.txp = txp;
    $scope.$apply();
  };

  var createTx = function(wallet, dryRun, cb) {
    var config = configService.getSync().wallet;
    var currentSpendUnconfirmed = config.spendUnconfirmed;
    var outputs = [];

    var paypro = $scope.paypro;
    var toAddress = $scope.toAddress;
    var toAmount = $scope.toAmount;
    var description = $scope.description;

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
    };

    outputs.push({
      'toAddress': toAddress,
      'amount': toAmount,
      'message': description
    });

    var txp = {};

    // TODO
    if (!lodash.isEmpty($scope.sendMaxInfo)) {
      txp.sendMax = true;
      txp.inputs = $scope.sendMaxInfo.inputs;
      txp.fee = $scope.sendMaxInfo.fee;
    }

    txp.outputs = outputs;
    txp.message = description;
    txp.payProUrl = paypro;
    txp.excludeUnconfirmedUtxos = config.spendUnconfirmed ? false : true;
    txp.feeLevel = config.settings.feeLevel || 'normal';
    txp.dryRun = dryRun;

    walletService.createTx(wallet, txp, function(err, ctxp) {
      if (err) {
        return setSendError(err);
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

  $scope.approve = function() {
    var wallet = $scope.wallet;
    if (!wallet) {
      return setSendError(gettextCatalog.getString('No wallet selected'));
    };


    if (!wallet.canSign() && !wallet.isPrivKeyExternal()) {
      $log.info('No signing proposal: No private key');

      return walletService.onlyPublish(wallet, txp, function(err, txp) {
        if (err) return setSendError(err);
      });
    }
    ongoingProcess.set('creatingTx', true);
    createTx(wallet, false, function(err, txp) {
      ongoingProcess.set('creatingTx', false);
      if (err) return;

      var config = configService.getSync();
      var spendingPassEnabled = walletService.isEncrypted(wallet);
      var touchIdEnabled = config.touchIdFor && !config.touchIdFor[wallet.id];
      var isCordova = $scope.isCordova;
      var bigAmount = parseFloat(txFormatService.formatToUSD(txp.amount)) > 20;
      var message = gettextCatalog.getString('Sending {{amountStr}} from your {{name}} wallet', {
        amountStr: $scope.amountStr,
        name: wallet.name
      });
      var okText = gettextCatalog.getString('Confirm');
      var cancelText = gettextCatalog.getString('Cancel');

      if (!spendingPassEnabled && !touchIdEnabled) {
        if (isCordova && bigAmount) {
          popupService.showConfirm(null, message, okText, cancelText, function(ok) {
            if (!ok) return;
            publishAndSign(wallet, txp);
          });
        }
        else {
          popupService.showConfirm(null, message, okText, cancelText, function(ok) {
            if (!ok) return;
            publishAndSign(wallet, txp);
          });
        }
      }
      else publishAndSign(wallet, txp);
    });
  };

  function publishAndSign(wallet, txp) {
    walletService.publishAndSign(wallet, txp, function(err, txp) {
      if (err) return setSendError(err);
    });
  };

  $scope.cancel = function() {
    $state.go('tabs.send');
  };
});
