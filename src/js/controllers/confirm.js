'use strict';

angular.module('copayApp.controllers').controller('confirmController', function($rootScope, $scope, $filter, $timeout, $ionicScrollDelegate, walletService, platformInfo, lodash, configService, go, rateService, $stateParams, $window, $state, $log, profileService, bitcore, $ionicPopup, txStatus, gettext, txFormatService) {

  var cachedTxp = {};

  // An alert dialog
  var showAlert = function(title, msg, cb) {
    $log.warn(title + ":" + msg);
    var alertPopup = $ionicPopup.alert({
      title: title,
      template: msg
    });

    if (!cb) cb = function() {};

    alertPopup.then(cb);
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

    var network = (new bitcore.Address($scope.toAddress)).network.name;
    $scope.network = network;

    function setWallets() {
      var w = profileService.getWallets({
        onlyComplete: true,
        network: network,
      });
      $scope.wallets = lodash.filter(w, function(x) {
        if (!x.availableBalanceSat) return true;
        return x.availableBalanceSat > amount;
      });

      $scope.someFiltered = $scope.wallets.length != w.length;

    };

    var stop;

    function setWallet(wallet, delayed) {
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
          createTx(wallet, $scope.toAddress, $scope.toAmount, $scope.comment, function(err, txp) {
            if (err) return;
            cachedTxp[wallet.id] = txp;
            apply(txp);
          });
        }, delayed ? 2000 : 1);
      }
    };

    txFormatService.formatAlternativeStr(amount, function(v) {
      $scope.alternativeAmountStr = v;
    });

    $scope.$on("$ionicSlides.slideChangeEnd", function(event, data) {
      setWallet($scope.wallets[data.slider.activeIndex], true);
    });

    setWallets();
    setWallet($scope.wallets[0]);

    $timeout(function() {
      $ionicScrollDelegate.resize();
    }, 100);
  };

  var setSendError = function(msg) {
    showAlert(gettext('Error creating transaction'), msg);
  };

  var createTx = function(wallet, toAddress, toAmount, comment, cb) {
    var config = configService.getSync().wallet;

    //
    var currentSpendUnconfirmed = config.spendUnconfirmed;
    var outputs = [];

    // TODO
    var paypro = $scope.paypro;

    // ToDo: use a credential's (or fc's) function for this
    if (comment && !wallet.credentials.sharedEncryptingKey) {
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
      'message': comment
    });

    var txp = {};

    // TODO
    if (!lodash.isEmpty($scope.sendMaxInfo)) {
      txp.sendMax = true;
      txp.inputs = $scope.sendMaxInfo.inputs;
      txp.fee = $scope.sendMaxInfo.fee;
    }

    txp.outputs = outputs;
    txp.message = comment;
    txp.payProUrl = paypro ? paypro.url : null;
    txp.excludeUnconfirmedUtxos = config.spendUnconfirmed ? false : true;
    txp.feeLevel = config.settings.feeLevel || 'normal';

    walletService.createTx(wallet, txp, function(err, ctxp) {
      if (err) {
        return setSendError(err);
      }
      return cb(null, ctxp);
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
