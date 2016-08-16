
'use strict';

angular.module('copayApp.controllers').controller('confirmController', function($rootScope, $scope, $filter, $timeout, $ionicScrollDelegate, walletService, platformInfo, lodash, configService, go, rateService, $stateParams, $window, $state, $log, profileService, bitcore) {


  var unitToSatoshi;
  var satToUnit;
  var unitDecimals;
  var satToBtc;
  var self = $scope.self;
  var SMALL_FONT_SIZE_LIMIT = 13;
  var LENGTH_EXPRESSION_LIMIT = 19;

  $scope.init = function() {
console.log('[confirm.js.23:$scope:]',$stateParams); //TODO

    // TODO (URL , etc)
    if (!$stateParams.toAddress || !$stateParams.toAmount) {
      $log.error('Bad params at amount')
      throw ('bad params');
    }

    $scope.isCordova = platformInfo.isCordova;

    var config = configService.getSync().wallet.settings;
    $scope.unitName = config.unitName;
    $scope.alternativeIsoCode = config.alternativeIsoCode;

    unitToSatoshi = config.unitToSatoshi;
    satToUnit = 1 / unitToSatoshi;
    satToBtc = 1 / 100000000;

    $scope.toAmount = $stateParams.toAmount;
    $scope.amount = (($stateParams.toAmount) * satToUnit).toFixed(unitDecimals) ;
    $scope.toAddress = $stateParams.toAddress;
    $scope.toName = $stateParams.toName;

    var network = (new bitcore.Address($scope.toAddress)).network.name;
    $scope.setWallets(network);

    $scope.alternativeAmount = toFiat($scope.toAmount);
    unitDecimals = config.unitDecimals;
    $timeout(function() {
      $ionicScrollDelegate.resize();
    }, 100);
  };



  var send = function() {
    if (!$scope._amount || !$scope._address) return;
    var unitToSat = this.unitToSatoshi;
    var currentSpendUnconfirmed = configWallet.spendUnconfirmed;

    var outputs = [];

    this.resetError();

    if (isCordova && this.isWindowsPhoneApp)
      $rootScope.shouldHideMenuBar = true;

    var form = $scope.sendForm;
    var comment = form.comment.$modelValue;

    // ToDo: use a credential's (or fc's) function for this
    if (comment && !client.credentials.sharedEncryptingKey) {
      var msg = 'Could not add message to imported wallet without shared encrypting key';
      $log.warn(msg);
      return self.setSendError(gettext(msg));
    }

    if (form.amount.$modelValue * unitToSat > Number.MAX_SAFE_INTEGER) {
      var msg = 'Amount too big';
      $log.warn(msg);
      return self.setSendError(gettext(msg));
    };

    $timeout(function() {
      var paypro = self._paypro;
      var address, amount;

      address = form.address.$modelValue;
      amount = parseInt((form.amount.$modelValue * unitToSat).toFixed(0));

      outputs.push({
        'toAddress': address,
        'amount': amount,
        'message': comment
      });

      var txp = {};

      if (!lodash.isEmpty(self.sendMaxInfo)) {
        txp.sendMax = true;
        txp.inputs = self.sendMaxInfo.inputs;
        txp.fee = self.sendMaxInfo.fee;
      } else {
        txp.amount = amount;
      }

      txp.toAddress = address;
      txp.outputs = outputs;
      txp.message = comment;
      txp.payProUrl = paypro ? paypro.url : null;
      txp.excludeUnconfirmedUtxos = configWallet.spendUnconfirmed ? false : true;
      txp.feeLevel = walletSettings.feeLevel || 'normal';

      ongoingProcess.set('creatingTx', true);
      walletService.createTx(client, txp, function(err, createdTxp) {
        ongoingProcess.set('creatingTx', false);
        if (err) {
          return self.setSendError(err);
        }

        if (!client.canSign() && !client.isPrivKeyExternal()) {
          $log.info('No signing proposal: No private key');
          ongoingProcess.set('sendingTx', true);
          walletService.publishTx(client, createdTxp, function(err, publishedTxp) {
            ongoingProcess.set('sendingTx', false);
            if (err) {
              return self.setSendError(err);
            }
            self.resetForm();
            go.walletHome();
            var type = txStatus.notify(createdTxp);
            $scope.openStatusModal(type, createdTxp, function() {
              return $scope.$emit('Local/TxProposalAction');
            });
          });
        } else {
          $rootScope.$emit('Local/NeedsConfirmation', createdTxp, function(accept) {
            if (accept) self.confirmTx(createdTxp);
            else self.resetForm();
          });
        }
      });

    }, 100);
  };



  function fromFiat(val) {
    return parseFloat((rateService.fromFiat(val, $scope.alternativeIsoCode) * satToUnit).toFixed(unitDecimals), 10);
  };

  function toFiat(val) {
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
  };


});
