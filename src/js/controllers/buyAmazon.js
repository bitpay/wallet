'use strict';

angular.module('copayApp.controllers').controller('buyAmazonController', function($scope, $log, $state, $timeout, $filter, $ionicHistory, lodash, amazonService, popupService, profileService, ongoingProcess, configService, walletService, payproService, bwcError, externalLinkService, platformInfo) {

  var amount;
  var currency;
  $scope.isCordova = platformInfo.isCordova;

  $scope.openExternalLink = function(url) {
    externalLinkService.open(url);
  };

  var showErrorAndBack = function(msg, err) {
    $scope.sendStatus = '';
    $log.error(err);
    err = err && err.errors ? err.errors[0].message : err;
    popupService.showAlert(msg, err, function() {
      $ionicHistory.goBack();
    });
  };

  var showError = function(msg, err) {
    $scope.sendStatus = '';
    $log.error(err);
    err = err && err.errors ? err.errors[0].message : (err || '');
    popupService.showAlert(msg, err);
  };

  var publishAndSign = function(wallet, txp, onSendStatusChange, cb) {
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

  var statusChangeHandler = function(processName, showName, isOn) {
    $log.debug('statusChangeHandler: ', processName, showName, isOn);
    if (processName == 'buyingGiftCard' && !isOn) {
      $scope.sendStatus = 'success';
      $timeout(function() {
        $scope.$digest();
      }, 100);
    } else if (showName) {
      $scope.sendStatus = showName;
    }
  };

  var checkTransaction = lodash.throttle(function(count, dataSrc) {
    amazonService.createGiftCard(dataSrc, function(err, giftCard) {
      $log.debug("creating gift card " + count);
      if (err) {
        ongoingProcess.set('buyingGiftCard', false, statusChangeHandler);
        giftCard = {};
        giftCard.status = 'FAILURE';
        showError('Error creating gift card', err);
      }

      if (giftCard.status == 'PENDING' && count < 3) {
        $log.debug("Waiting for payment confirmation");
        checkTransaction(count + 1, dataSrc);
        return;
      }

      var now = moment().unix() * 1000;

      var newData = giftCard;
      newData['invoiceId'] = dataSrc.invoiceId;
      newData['accessKey'] = dataSrc.accessKey;
      newData['invoiceUrl'] = dataSrc.invoiceUrl;
      newData['amount'] = dataSrc.amount;
      newData['date'] = dataSrc.invoiceTime || now;
      newData['uuid'] = dataSrc.uuid;

      if (newData.status == 'expired') {
        amazonService.savePendingGiftCard(newData, {
          remove: true
        }, function(err) {
          $log.error(err);
          ongoingProcess.set('buyingGiftCard', false, statusChangeHandler);
          showError('Gift card expired');
          return;
        });
      }

      amazonService.savePendingGiftCard(newData, null, function(err) {
        ongoingProcess.set('buyingGiftCard', false, statusChangeHandler);
        $log.debug("Saving new gift card with status: " + newData.status);
        $scope.amazonGiftCard = newData;
      });
    });
  }, 8000, {
    'leading': true
  });

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    amount = data.stateParams.amount;
    currency = data.stateParams.currency;

    if (amount > 1000) {
      showErrorAndBack('Purchase Amount is limited to USD 1000 per day');
      return;
    }

    $scope.amountUnitStr = $filter('formatFiatAmount')(amount) + ' ' + currency;

    $scope.network = amazonService.getNetwork();
    $scope.wallets = profileService.getWallets({
      onlyComplete: true,
      network: $scope.network
    });
    $scope.wallet = $scope.wallets[0]; // Default first wallet
  });

  $scope.buyConfirm = function() {

    var message = 'Buy gift card for ' + amount + ' ' + currency;
    var okText = 'Confirm';
    var cancelText = 'Cancel';
    popupService.showConfirm(null, message, okText, cancelText, function(ok) {
      if (!ok) return;

      var config = configService.getSync();
      var configWallet = config.wallet;
      var walletSettings = configWallet.settings;
      // Get first wallet as UUID
      var uuid = $scope.wallet.id;
      var dataSrc = {
        currency: currency,
        amount: amount,
        uuid: uuid
      };

      ongoingProcess.set('buyingGiftCard', true, statusChangeHandler);
      amazonService.createBitPayInvoice(dataSrc, function(err, dataInvoice) {
        if (err) {
          ongoingProcess.set('buyingGiftCard', false, statusChangeHandler);
          showError('Error creating BitPay invoice', err);
          return;
        }

        var accessKey = dataInvoice ? dataInvoice.accessKey : null;

        if (!accessKey) {
          ongoingProcess.set('buyingGiftCard', false, statusChangeHandler);
          showError('No access key defined');
          return;
        }

        amazonService.getBitPayInvoice(dataInvoice.invoiceId, function(err, invoice) {
          if (err) {
            ongoingProcess.set('buyingGiftCard', false, statusChangeHandler);
            showError('Error getting BitPay invoice', err);
            return;
          }

          var payProUrl = (invoice && invoice.paymentUrls) ? invoice.paymentUrls.BIP73 : null;

          if (!payProUrl) {
            ongoingProcess.set('buyingGiftCard', false, statusChangeHandler);
            showError('Error fetching invoice');
            return;
          }

          payproService.getPayProDetails(payProUrl, function(err, payProDetails) {
            if (err) {
              ongoingProcess.set('buyingGiftCard', false, statusChangeHandler);
              showError('Error fetching payment info', bwcError.msg(err));
              return;
            }

            var outputs = [];
            var toAddress = payProDetails.toAddress;
            var amountSat = payProDetails.amount;
            var comment = amount + ' ' + currency + ' Amazon.com Gift Card';

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
                ongoingProcess.set('buyingGiftCard', false, statusChangeHandler);
                showError('Could not create transaction', bwcError.msg(err));
                return;
              }
              publishAndSign($scope.wallet, ctxp, function() {}, function(err, txSent) {
                if (err) {
                  ongoingProcess.set('buyingGiftCard', false, statusChangeHandler);
                  showError('Could not send transaction', err);
                  return;
                }
                $log.debug('Transaction broadcasted. Waiting for confirmation...');
                var invoiceId = JSON.parse(payProDetails.merchant_data).invoiceId;
                var dataSrc = {
                  currency: currency,
                  amount: amount,
                  uuid: uuid,
                  accessKey: accessKey,
                  invoiceId: invoice.id,
                  invoiceUrl: payProUrl,
                  invoiceTime: invoice.invoiceTime
                };
                checkTransaction(1, dataSrc);
              });
            });
          }, true); // Disable loader
        });
      });
    });
  };

  $scope.showWalletSelector = function() {
    $scope.walletSelectorTitle = 'Buy from';
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
    var claimCode = $scope.amazonGiftCard ? $scope.amazonGiftCard.claimCode : null;
    $state.go('tabs.home').then(function() {
      $ionicHistory.nextViewOptions({
        disableAnimate: true
      });
      $state.transitionTo('tabs.giftcards.amazon').then(function() {
        $state.transitionTo('tabs.giftcards.amazon.cards', {
          cardClaimCode: claimCode
        });
      });
    });
  };
});
