'use strict';

angular.module('copayApp.controllers').controller('confirmController', function($rootScope, $scope, $filter, $timeout, $ionicScrollDelegate, walletService, platformInfo, lodash, configService, go, rateService, $stateParams, $window, $state, $log, profileService, bitcore, $ionicPopup, txStatus, ongoingProcess, fingerprintService, gettext) {

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


  // An alert dialog
  var askPassword = function(name, cb) {
    $scope.data = [];
    var pass = $ionicPopup.show({
      template: '<input type="password" ng-model="data.pass">',
      title: 'Enter Spending Password',
      subTitle: name,
      scope: $scope,
      buttons: [{
        text: 'Cancel'
      }, {
        text: '<b>OK</b>',
        type: 'button-positive',
        onTap: function(e) {

console.log('[confirm.js.32]', $scope, $scope.data); //TODO
          if (!$scope.data.pass) {
            //don't allow the user to close unless he enters wifi password
            e.preventDefault();
            return;

          } 

          return $scope.data.pass; 
        }
      }]
    });
    pass.then(function(res) {
      console.log('Tapped!', res);
      return cb(res);
    });  
  };



  var handleEncryptedWallet = function(wallet, cb) {
    if (!walletService.isEncrypted(wallet)) return cb();

    askPassword(wallet.name, function(password) {
      if (!password) return cb('no password');
      return cb(walletService.unlock(wallet, password));
    });
  };

  var unitToSatoshi;
  var satToUnit;
  var unitDecimals;
  var satToBtc;
  var SMALL_FONT_SIZE_LIMIT = 13;
  var LENGTH_EXPRESSION_LIMIT = 19;
  var config;

  $scope.init = function() {

    // TODO (URL , etc)
    if (!$stateParams.toAddress || !$stateParams.toAmount) {
      $log.error('Bad params at amount')
      throw ('bad params');
    }

    $scope.isCordova = platformInfo.isCordova;

    config = configService.getSync().wallet;
    $scope.feeLevel = config.feeLevel;

    $scope.unitName = config.settings.unitName;
    $scope.alternativeIsoCode = config.settings.alternativeIsoCode;

    unitToSatoshi = config.settings.unitToSatoshi;
    satToUnit = 1 / unitToSatoshi;
    satToBtc = 1 / 100000000;

    $scope.toAmount = parseInt($stateParams.toAmount);
    $scope.amount = (($stateParams.toAmount) * satToUnit).toFixed(unitDecimals);
    $scope.toAddress = $stateParams.toAddress;
    $scope.toName = $stateParams.toName;

    var network = (new bitcore.Address($scope.toAddress)).network.name;
    $scope.setWallets(network);

    toFiat($scope.amount, function(v) {
      $scope.alternativeAmount = v;
    });

    unitDecimals = config.settings.unitDecimals;

    $scope.$on("$ionicSlides.slideChangeEnd", function(event, data) {
      $scope.wallet = $scope.wallets[data.slider.activeIndex];
    });

    createTx($scope.toAddress, $scope.toAmount);

    $timeout(function() {
      $ionicScrollDelegate.resize();
    }, 100);
  };

  var setSendError = function(msg) {
    showAlert(gettext('Error creating transaction'), msg);
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
      }

      txp.outputs = outputs;
      txp.message = comment;
      txp.payProUrl = paypro ? paypro.url : null;
      txp.excludeUnconfirmedUtxos = config.spendUnconfirmed ? false : true;
      txp.feeLevel = config.feeLevel || 'normal';


      walletService.createTx(wallet, txp, function(err, createdTxp) {
        if (err) {
          return setSendError(err);
        }

        $scope.fee = ((createdTxp.fee) * satToUnit).toFixed(unitDecimals);
        $scope.txp = createdTxp;
      });
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
      ongoingProcess.set('sendingTx', true);
      walletService.publishTx(wallet, txp, function(err, publishedTxp) {
        ongoingProcess.set('sendingTx', false);
        if (err) {
          return setSendError(err);
        }

        $state.transitionTo('tab.home');

        var type = txStatus.notify(createdTxp);
        $scope.openStatusModal(type, createdTxp, function() {
          return $scope.$emit('Local/TxProposalAction');
        });
      });
      return;
    }

    fingerprintService.check(wallet, function(err) {
      if (err) {
        return setSendError(err);
      }

      handleEncryptedWallet(wallet, function(err) {
        if (err) {
          return setSendError(err);
        }

        ongoingProcess.set('sendingTx', true);
        walletService.publishTx(wallet, txp, function(err, publishedTxp) {
          ongoingProcess.set('sendingTx', false);
          if (err) {
            return setSendError(err);
          }

          ongoingProcess.set('signingTx', true);
          walletService.signTx(wallet, txp, function(err, signedTxp) {
            ongoingProcess.set('signingTx', false);
            walletService.lock(wallet);
            if (err) {
              $scope.$emit('Local/TxProposalAction');
              return setSendError(
                err.message ?
                err.message :
                gettext('The payment was created but could not be completed. Please try again from home screen'));
            }

            if (signedTxp.status == 'accepted') {
              ongoingProcess.set('broadcastingTx', true);
              walletService.broadcastTx(wallet, signedTxp, function(err, broadcastedTxp) {
                ongoingProcess.set('broadcastingTx', false);
                if (err) {
                  return setSendError(err);
                }

                $state.transitionTo('tabs.send');
                var type = txStatus.notify(broadcastedTxp);
                $scope.openStatusModal(type, broadcastedTxp, function() {
                  $scope.$emit('Local/TxProposalAction', broadcastedTxp.status == 'broadcasted');
                });
              });
            } else {
              $state.transitionTo('tabs.send');
              var type = txStatus.notify(signedTxp);
              $scope.openStatusModal(type, signedTxp, function() {
                $scope.$emit('Local/TxProposalAction');
              });
            }
          });
        });
      });
    });
  };

  function toFiat(val, cb) {
    rateService.whenAvailable(function() {
      return cb(parseFloat((rateService.toFiat(val * unitToSatoshi, $scope.alternativeIsoCode)).toFixed(2), 10));
    });
  };

  $scope.cancel = function() {
    $state.transitionTo('tabs.send');
  };

  $scope.setWallets = function(network) {
    $scope.wallets = profileService.getWallets({
      onlyComplete: true,
      network: network
    });
    $scope.wallet = $scope.wallets[0];
  };


});
