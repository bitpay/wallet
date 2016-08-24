'use strict';

angular.module('copayApp.controllers').controller('confirmController', function($rootScope, $scope, $filter, $timeout, $ionicScrollDelegate, gettextCatalog, walletService, platformInfo, lodash, configService, rateService, $stateParams, $window, $state, $log, profileService, bitcore, $ionicPopup, txStatus, gettext, txFormatService, ongoingProcess, $ionicModal) {

  var cachedTxp = {};
  var isChromeApp = platformInfo.isChromeApp;

  // An alert dialog
  var showAlert = function(title, msg, cb) {
    var message = msg.message ? msg.message : msg;
    $log.warn(title + ": " + message);

    var alertPopup = $ionicPopup.alert({
      title: title,
      template: message
    });

    if (!cb) cb = function() {};
    alertPopup.then(cb);
  };

  $scope.showDescriptionPopup = function() {
    var commentPopup = $ionicPopup.show({
      templateUrl: "views/includes/note.html",
      title: gettextCatalog.getString('Set description'),
      scope: $scope,
    });
    $scope.commentPopupClose = function() {
      commentPopup.close();
    };
    $scope.commentPopupSave = function() {
      $log.debug('Saving description: ' + $scope.data.comment);
      $scope.description = $scope.data.comment;
      $scope.txp = null;

      createTx($scope.wallet, function(err, txp) {
        if (err) return;
        cachedTxp[$scope.wallet.id] = txp;
        apply(txp);
      });
      commentPopup.close();
    };
  };

  var setFromPayPro = function(uri, cb) {
    if (!cb) cb = function() {};

    var wallet = profileService.getWallets({
      onlyComplete: true
    })[0];

    if (!wallet) return cb();

    if (isChromeApp) {
      showAlert(gettext('Payment Protocol not supported on Chrome App'));
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
          msg = gettext('Could not fetch payment information');
        }
        showAlert(msg);
        return cb(true);
      }

      if (!paypro.verified) {
        $log.warn('Failed to verify payment protocol signatures');
        showAlert(gettext('Payment Protocol Invalid'));
        return cb(true);
      }

      $stateParams.toAmount = paypro.amount;
      $stateParams.toAddress = paypro.toAddress;
      $stateParams.description = paypro.memo;
      $stateParams.paypro = null;

      $scope._paypro = paypro;
      return $scope.init();
    });
  };

  $scope.init = function() {
    // TODO (URL , etc)
    if (!$stateParams.toAddress || !$stateParams.toAmount) {
      $log.error('Bad params at amount')
      throw ('bad params');
    }

    $scope.isCordova = platformInfo.isCordova;

    var config = configService.getSync().wallet;
    $scope.feeLevel = config.settings ? config.settings.feeLevel : '';

    var amount = $scope.toAmount = parseInt($stateParams.toAmount);
    $scope.amountStr = txFormatService.formatAmountStr($scope.toAmount);

    $scope.toAddress = $stateParams.toAddress;
    $scope.toName = $stateParams.toName;
    $scope.description = $stateParams.description;
    $scope.paypro = $stateParams.paypro;

    var networkName = (new bitcore.Address($scope.toAddress)).network.name;
    $scope.network = networkName;

    $scope.notAvailable = false;
    var wallets = profileService.getWallets({
      onlyComplete: true,
      network: networkName,
    });

    var filteredWallets = [];
    var index = 0;

    filterWallet();

    function filterWallet() {
      if (index == wallets.length) {
        if (!lodash.isEmpty(filteredWallets)) {
          $log.debug('Wallet changed: ' + filteredWallets[0].name);
          $scope.wallets = lodash.clone(filteredWallets);
          setWallet(wallets[0], true);
          $scope.notAvailable = false;
        } else {
          $scope.notAvailable = true;
          $log.warn('No wallet available to make the payment');
        }

        $timeout(function() {
          $scope.$apply();
        }, 10);
        return;
      }

      walletService.getStatus(wallets[index], {}, function(err, status) {
        if (err) $log.error(err);
        if (!status.availableBalanceSat) $log.debug('No balance available in: ' + wallets[index].name);
        if (status.availableBalanceSat > amount) filteredWallets.push(wallets[index]);
        index++;
        filterWallet();
      });
    };

    txFormatService.formatAlternativeStr(amount, function(v) {
      $scope.alternativeAmountStr = v;
    });
  };

  $scope.$on('Wallet/Changed', function(event, wallet) {
    if (!wallet) {
      $log.debug('No wallet provided');
      return;
    }
    $log.debug('Wallet changed: ' + wallet.name);
    setWallet(wallet, true);
  });

  function setWallet(wallet, delayed) {
    var stop;
    $scope.wallet = wallet;
    $scope.fee = $scope.txp = null;

    $timeout(function() {
      $scope.$apply();
    }, 10);

    if (stop) {
      $timeout.cancel(stop);
      stop = null;
    }

    function apply(txp) {
      $scope.fee = txFormatService.formatAmountStr(txp.fee);
      $scope.txp = txp;
      $scope.$apply();
    };

    if (cachedTxp[wallet.id]) {
      apply(cachedTxp[wallet.id]);
    } else {
      stop = $timeout(function() {
        createTx(wallet, $scope.toAddress, $scope.toAmount, $scope.comment || null, function(err, txp) {
          if (err) return;
          cachedTxp[wallet.id] = txp;
          apply(txp);
        });
      }, delayed ? 2000 : 1);
    }
  };

  var setSendError = function(msg) {
    showAlert(gettext('Error creating transaction'), msg);
  };

  function apply(txp) {
    $scope.fee = txFormatService.formatAmountStr(txp.fee);
    $scope.txp = txp;
    $scope.$apply();
  };

  var createTx = function(wallet, cb) {
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
      return setSendError(gettext(msg));
    }

    if (toAmount > Number.MAX_SAFE_INTEGER) {
      var msg = 'Amount too big';
      $log.warn(msg);
      return setSendError(gettext(msg));
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
    var txp = $scope.txp;
    if (!wallet) {
      return setSendError(gettext('No wallet selected'));
      return;
    };

    if (!txp) {
      return setSendError(gettext('No transaction'));
      return;
    };

    if (!wallet.canSign() && !wallet.isPrivKeyExternal()) {
      $log.info('No signing proposal: No private key');

      return walletService.onlyPublish(wallet, txp, function(err, txp) {
        if (err) return setSendError(err);
        $state.transitionTo('tabs.home');
      });
    }

    walletService.publishAndSign(wallet, txp, function(err, txp) {
      if (err) return setSendError(err);
      $state.transitionTo('tabs.home');
    });
  };

  $scope.cancel = function() {
    $state.transitionTo('tabs.send');
  };
});
