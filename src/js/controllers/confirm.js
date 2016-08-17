
'use strict';

angular.module('copayApp.controllers').controller('confirmController', function($rootScope, $scope, $filter, $timeout, $ionicScrollDelegate, walletService, platformInfo, lodash, configService, go, rateService, $stateParams, $window, $state, $log, profileService, bitcore, $ionicPopup) {

  // An alert dialog
  var showAlert = function(title, msg, cb) {
    $log.warn(title +  ":"+ msg);
    var alertPopup = $ionicPopup.alert({
      title: title,
      template: msg
    });

    if (!cb) cb = function() {};

    alertPopup.then(cb);
  };


  var unitToSatoshi;
  var satToUnit;
  var unitDecimals;
  var satToBtc;
  var self = $scope.self;
  var SMALL_FONT_SIZE_LIMIT = 13;
  var LENGTH_EXPRESSION_LIMIT = 19;
  var config;

  $scope.init = function() {
console.log('[confirm.js.23:$scope:]',$stateParams); //TODO

    // TODO (URL , etc)
    if (!$stateParams.toAddress || !$stateParams.toAmount) {
      $log.error('Bad params at amount')
      throw ('bad params');
    }

    $scope.isCordova = platformInfo.isCordova;

    config = configService.getSync().wallet;

    $scope.unitName = config.settings.unitName;
    $scope.alternativeIsoCode = config.settings.alternativeIsoCode;

    unitToSatoshi = config.settings.unitToSatoshi;
    satToUnit = 1 / unitToSatoshi;
    satToBtc = 1 / 100000000;

    $scope.toAmount = $stateParams.toAmount;
    $scope.amount = (($stateParams.toAmount) * satToUnit).toFixed(unitDecimals) ;
    $scope.toAddress = $stateParams.toAddress;
    $scope.toName = $stateParams.toName;

    var network = (new bitcore.Address($scope.toAddress)).network.name;
    $scope.setWallets(network);

    $scope.alternativeAmount = toFiat($scope.toAmount);
    unitDecimals = config.settings.unitDecimals;

    $scope.$on("$ionicSlides.slideChangeEnd", function(event, data) {
      $scope.wallet = $scope.wallets[data.slider.activeIndex];
    });

    createTx($scope.toAddress, $scope.toAmount);

    $timeout(function() {
      $ionicScrollDelegate.resize();
    }, 100);
  };

  var  setSendError = function(msg) {
    showAlert('Error creating transaction', msg);
  };

  var createTx = function(toAddress, toAmount, comment) {
    //
    var currentSpendUnconfirmed = config.spendUnconfirmed;


////
    var wallet = $scope.wallet;
    if (!wallet) {
      $log.error('No wallet selected')
      return;
    };

    var outputs = [];
    var comment = $scope.comment;
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

    $timeout(function() {
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
        } else {
          txp.amount = toAmount;
        }

        txp.toAddress = toAddress;
//        txp.outputs = outputs;
        txp.message = comment;
        txp.payProUrl = paypro ? paypro.url : null;
        txp.excludeUnconfirmedUtxos = config.spendUnconfirmed ? false : true;
        txp.feeLevel = config.feeLevel || 'normal';


console.log('[confirm.js.100] creatingTx', wallet, txp); //TODO
        walletService.createTx(wallet, txp, function(err, createdTxp) {
console.log('[confirm.js.102:createdTxp:]',err, createdTxp); //TODO
          if (err) {
            return setSendError(err);
          }

          $scope.fee = createdTxp.fee;
          $scope.txp = createdTxp;
        });
    });
  };


  $scope.approve = function() {
    var wallet = $scope.wallet;
    var txp  =$scope.txp;
    if (!wallet) {
      $log.error('No wallet selected')
      return;
    };

    if (!txp) {
      $log.error('No txp')
      return;
    };



    if (!wallet.canSign() && !wallet.isPrivKeyExternal()) {
      $log.info('No signing proposal: No private key');
//      ongoingProcess.set('sendingTx', true);
      walletService.publishTx(walelt, txp, function(err, publishedTxp) {
//        ongoingProcess.set('sendingTx', false);
        if (err) {
          return setSendError(err);
        }

        // TODO
        $state.transitionTo('tab.home');
        // TODO
        // var type = txStatus.notify(createdTxp);
        // $scope.openStatusModal(type, createdTxp, function() {
        //   return $scope.$emit('Local/TxProposalAction');
        // });
      });
    } else {
     
      $rootScope.$emit('Local/NeedsConfirmation', txp, function(accept) {
        if (accept) self.confirmTx(txp);
        else self.resetForm();
      });
    }
  };




  function fromFiat(val) {
    if (!rateService.isAvailable()) return;
    
    return parseFloat((rateService.fromFiat(val, $scope.alternativeIsoCode) * satToUnit).toFixed(unitDecimals), 10);
  };

  function toFiat(val) {
    if (!rateService.isAvailable()) return;

    return parseFloat((rateService.toFiat(val * unitToSatoshi, $scope.alternativeIsoCode)).toFixed(2), 10);
  };

  $scope.finish = function() {
    var _amount = evaluate(format($scope.amount));
    var amount = $scope.showAlternativeAmount ? fromFiat(_amount).toFixed(unitDecimals) : _amount.toFixed(unitDecimals);

    $state.transitionTo('confirm', {
      toAmount:walletService.formatAmount(amount * unitToSatoshi, true),
      toAddress: $scope.toAddress,
      toName: $scope.toName,
    });
  };

  $scope.cancel = function() {
    $state.transitionTo('tabs.send');
  };

  $scope.setWallets = function(network) {
    $scope.wallets = profileService.getWallets({onlyComplete:true, network: network});
    $scope.wallet = $scope.wallets[0];
  };




});
