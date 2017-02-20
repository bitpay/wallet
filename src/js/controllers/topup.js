'use strict';

angular.module('copayApp.controllers').controller('topUpController', function($scope, $log, $state, $timeout, $ionicHistory, lodash, popupService, profileService, ongoingProcess, walletService, configService, platformInfo, bitpayService, bitpayCardService, payproService) {

  var amount;
  var currency;
  var cardId;

  $scope.isCordova = platformInfo.isCordova;

  var showErrorAndBack = function(err) {
    $scope.sendStatus = '';
    $log.error(err);
    err = err.errors ? err.errors[0].message : err;
    popupService.showAlert('Error', err, function() {
      $ionicHistory.goBack();
    });
  };

  var showError = function(err) {
    $scope.sendStatus = '';
    $log.error(err);
    err = err.errors ? err.errors[0].message : err;
    popupService.showAlert('Error', err);
  };

  var publishAndSign = function (wallet, txp, onSendStatusChange, cb) {
    if (!wallet.canSign() && !wallet.isPrivKeyExternal()) {
      var err = 'No signing proposal: No private key';
      $log.info(err);
      return cb(err);
    }

    walletService.publishAndSign(wallet, txp, function(err, txp) {
      if (err) return cb(err);
      return cb(null, txp);
    }, onSendStatusChange);
  };

  var statusChangeHandler = function (processName, showName, isOn) {
    $log.debug('statusChangeHandler: ', processName, showName, isOn);
    if ( processName == 'topup' && !isOn) {
      $scope.sendStatus = 'success';
      $timeout(function() {
        $scope.$digest();
      }, 100);
    } else if (showName) {
      $scope.sendStatus = showName;
    }
  };

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    $scope.isFiat = data.stateParams.currency ? true : false;
    cardId = data.stateParams.id;

    if (!cardId) {
      showErrorAndBack('No card selected');
      return;
    }

    var parsedAmount = bitpayCardService.parseAmount(
      data.stateParams.amount, 
      data.stateParams.currency);

    amount = parsedAmount.amount;
    currency = parsedAmount.currency;
    $scope.amountUnitStr = parsedAmount.amountUnitStr;

    $scope.network = bitpayService.getEnvironment().network;
    $scope.wallets = profileService.getWallets({
      m: 1, // Only 1-signature wallet
      onlyComplete: true,
      network: $scope.network
    });
    $scope.wallet = $scope.wallets[0]; // Default first wallet

    bitpayCardService.getRates(currency, function(err, data) {
      if (err) $log.error(err);
      $scope.rate = data.rate;
    });

    bitpayCardService.get({ cardId: cardId, noRefresh: true }, function(err, card) {
      if (err) {
        showErrorAndBack(err);
        return;
      }
      $scope.cardInfo = card[0];
    });

  });

  $scope.topUpConfirm = function() {

    var config = configService.getSync();
    var configWallet = config.wallet;
    var walletSettings = configWallet.settings;

    var message = 'Add ' + amount + ' ' + currency + ' to debit card';
    var okText = 'Confirm';
    var cancelText = 'Cancel';
    popupService.showConfirm(null, message, okText, cancelText, function(ok) {
      if (!ok) return;

      var dataSrc = {
        amount: amount,
        currency: currency
      };
      ongoingProcess.set('topup', true, statusChangeHandler);
      bitpayCardService.topUp(cardId, dataSrc, function(err, invoiceId) {
        if (err) {
          ongoingProcess.set('topup', false, statusChangeHandler);
          showError(err);
          return;
        }

        bitpayCardService.getInvoice(invoiceId, function(err, invoice) {
          if (err) {
            ongoingProcess.set('topup', false, statusChangeHandler);
            showError(err);
            return;
          }

          var payProUrl = (invoice && invoice.paymentUrls) ? invoice.paymentUrls.BIP73 : null;

          if (!payProUrl) {
            ongoingProcess.set('topup', false, statusChangeHandler);
            showError('Error fetching invoice');
            return;
          }

          payproService.getPayProDetails(payProUrl, function(err, payProDetails) {
            if (err) {
              ongoingProcess.set('topup', false, statusChangeHandler);
              showError(err);
              return;
            }

            var outputs = [];
            var toAddress = payProDetails.toAddress;
            var amountSat = payProDetails.amount;
            var comment = 'Top up ' + amount + ' ' + currency + ' to Debit Card';

            outputs.push({
              'toAddress': toAddress,
              'amount': amountSat,
              'message': comment
            });

            var txp = {
              toAddress: toAddress,
              amount: amountSat,
              outputs: outputs,
              message: comment,
              payProUrl: payProUrl,
              excludeUnconfirmedUtxos: configWallet.spendUnconfirmed ? false : true,
              feeLevel: walletSettings.feeLevel || 'normal'
            };

            walletService.createTx($scope.wallet, txp, function(err, ctxp) {
              if (err) {
                ongoingProcess.set('topup', false, statusChangeHandler);
                showError('Could not create transaction', bwcError.msg(err));
                return;
              }
              publishAndSign($scope.wallet, ctxp, function() {}, function(err, txSent) {
                ongoingProcess.set('topup', false, statusChangeHandler);
                if (err) {
                  showError('Could not send transaction', err);
                  return;
                }
              });
            });
          }, true); // Disable loader
        });
      }); 
    }); 
  };

  $scope.showWalletSelector = function() {
    $scope.walletSelectorTitle = 'From';
    $scope.showWallets = true;
  };

  $scope.onWalletSelect = function(wallet) {
    $scope.wallet = wallet;
  };

  $scope.goBackHome = function() {
    $scope.sendStatus = '';
    $ionicHistory.nextViewOptions({
      disableAnimate: true,
      historyRoot: true
    });
    $ionicHistory.clearHistory();
    $state.go('tabs.home').then(function() {
      $state.transitionTo('tabs.bitpayCard', {id: cardId});
    });
  };

});
