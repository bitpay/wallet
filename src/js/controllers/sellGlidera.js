'use strict';

angular.module('copayApp.controllers').controller('sellGlideraController', function($scope, $log, $state, $timeout, $ionicHistory, $ionicConfig, lodash, glideraService, popupService, profileService, ongoingProcess, walletService, configService, platformInfo, txFormatService) {

  var coin = 'btc';
  var amount;
  var currency;

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

  var statusChangeHandler = function (processName, showName, isOn) {
    $log.debug('statusChangeHandler: ', processName, showName, isOn);
    if ( processName == 'sellingBitcoin' && !isOn) {
      $scope.sendStatus = 'success';
      $timeout(function() {
        $scope.$digest();
      }, 100);
    } else if (showName) {
      $scope.sendStatus = showName;
    }
  };

  var processPaymentInfo = function() {
    ongoingProcess.set('connectingGlidera', true);
    glideraService.init(function(err, data) {
      if (err) {
        ongoingProcess.set('connectingGlidera', false);
        showErrorAndBack(err);
        return;
      }
      $scope.token = data.token;
      var price = {};
      if ($scope.isFiat) {
        price['fiat'] = amount;
      } else {
        price['qty'] = amount;
      }
      glideraService.sellPrice($scope.token, price, function(err, sell) {
        ongoingProcess.set('connectingGlidera', false);
        if (err) {
          showErrorAndBack(err);
          return;
        }
        $scope.sellInfo = sell;
      });
    });
  };

  $scope.$on("$ionicView.beforeLeave", function(event, data) {
    $ionicConfig.views.swipeBackEnabled(true);
  });

  $scope.$on("$ionicView.enter", function(event, data) {
    $ionicConfig.views.swipeBackEnabled(false);
  });

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    $scope.isFiat = data.stateParams.currency != 'BTC' ? true : false;
    amount = data.stateParams.amount;
    currency = data.stateParams.currency;

    $scope.network = glideraService.getNetwork();
    $scope.wallets = profileService.getWallets({
      m: 1, // Only 1-signature wallet
      onlyComplete: true,
      network: $scope.network,
      hasFunds: true,
      coin: coin
    });

    if (lodash.isEmpty($scope.wallets)) {
      showErrorAndBack('Insufficient funds');
      return;
    }
    $scope.onWalletSelect($scope.wallets[0]); // Default first wallet
  });

  var ask2FaCode = function(mode, cb) {
    if (mode != 'NONE') {
      // SHOW PROMPT
      var title = 'Please, enter the code below';
      var message;
      if (mode == 'PIN') {
        message = 'You have enabled PIN based two-factor authentication.';
      } else if (mode == 'AUTHENTICATOR') {
        message = 'Use an authenticator app (Authy or Google Authenticator).';
      } else {
        message = 'A SMS containing a confirmation code was sent to your phone.';
      }
      popupService.showPrompt(title, message, null, function(twoFaCode) {
        if (typeof twoFaCode == 'undefined') return cb();
        return cb(twoFaCode);
      });
    } else {
      return cb();
    }
  };

  $scope.sellConfirm = function() {
    var message = 'Sell bitcoin for ' + amount + ' ' + currency;
    var okText = 'Confirm';
    var cancelText = 'Cancel';
    popupService.showConfirm(null, message, okText, cancelText, function(ok) {
      if (!ok) return;
      ongoingProcess.set('sellingBitcoin', true, statusChangeHandler);
      glideraService.get2faCode($scope.token, function(err, tfa) {
        if (err) {
          ongoingProcess.set('sellingBitcoin', false, statusChangeHandler);
          showError(err);
          return;
        }
        ask2FaCode(tfa.mode, function(twoFaCode) {
          if (tfa.mode != 'NONE' && lodash.isEmpty(twoFaCode)) {
            ongoingProcess.set('sellingBitcoin', false, statusChangeHandler);
            showError('No code entered');
            return;
          }

          var outputs = [];
          var config = configService.getSync();
          var configWallet = config.wallet;
          var walletSettings = configWallet.settings;

          walletService.getAddress($scope.wallet, null, function(err, refundAddress) {
            if (!refundAddress) {
              ongoingProcess.set('sellingBitcoin', false, statusChangeHandler);
              showError('Could not create address');
              return;
            }
            glideraService.getSellAddress($scope.token, function(err, sellAddress) {
              if (!sellAddress || err) {
                ongoingProcess.set('sellingBitcoin', false, statusChangeHandler);
                showError(err);
                return;
              }
              var amount = parseInt(($scope.sellInfo.qty * 100000000).toFixed(0));
              var comment = 'Glidera transaction';

              outputs.push({
                'toAddress': sellAddress,
                'amount': amount,
                'message': comment
              });

              var txp = {
                toAddress: sellAddress,
                amount: amount,
                outputs: outputs,
                message: comment,
                payProUrl: null,
                excludeUnconfirmedUtxos: configWallet.spendUnconfirmed ? false : true,
                feeLevel: walletSettings.feeLevel || 'normal',
                customData: {
                  'glideraToken': $scope.token
                }
              };

              walletService.createTx($scope.wallet, txp, function(err, createdTxp) {
                if (err) {
                  ongoingProcess.set('sellingBitcoin', false, statusChangeHandler);
                  showError(err);
                  return;
                }
                walletService.prepare($scope.wallet, function(err, password) {
                  if (err) {
                    ongoingProcess.set('sellingBitcoin', false, statusChangeHandler);
                    showError(err);
                    return;
                  }
                  walletService.publishTx($scope.wallet, createdTxp, function(err, publishedTxp) {
                    if (err) {
                      ongoingProcess.set('sellingBitcoin', false, statusChangeHandler);
                      showError(err);
                      return;
                    }
                    walletService.signTx($scope.wallet, publishedTxp, password, function(err, signedTxp) {
                      if (err) {
                        ongoingProcess.set('sellingBitcoin', false, statusChangeHandler);
                        showError(err);
                        walletService.removeTx($scope.wallet, signedTxp, function(err) {
                          if (err) $log.debug(err);
                        });
                        return;
                      }
                      var rawTx = signedTxp.raw;
                      var data = {
                        refundAddress: refundAddress,
                        signedTransaction: rawTx,
                        priceUuid: $scope.sellInfo.priceUuid,
                        useCurrentPrice: $scope.sellInfo.priceUuid ? false : true,
                        ip: null
                      };
                      glideraService.sell($scope.token, twoFaCode, data, function(err, data) {
                        ongoingProcess.set('sellingBitcoin', false, statusChangeHandler);
                        if (err) return showError(err);
                        $log.info(data);
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  };

  $scope.showWalletSelector = function() {
    $scope.walletSelectorTitle = 'Sell From';
    $scope.showWallets = true;
  };

  $scope.onWalletSelect = function(wallet) {
    $scope.wallet = wallet;
    var parsedAmount = txFormatService.parseAmount(
      coin,
      amount,
      currency);

    amount = parsedAmount.amount;
    currency = parsedAmount.currency;
    $scope.amountUnitStr = parsedAmount.amountUnitStr;
    processPaymentInfo();
  };

  $scope.goBackHome = function() {
    $scope.sendStatus = '';
    $ionicHistory.nextViewOptions({
      disableAnimate: true,
      historyRoot: true
    });
    $ionicHistory.clearHistory();
    $state.go('tabs.home').then(function() {
      $state.transitionTo('tabs.buyandsell.glidera');
    });
  };

});
