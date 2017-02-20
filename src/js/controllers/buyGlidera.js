'use strict';

angular.module('copayApp.controllers').controller('buyGlideraController', function($scope, $log, $state, $timeout, $ionicHistory, lodash, glideraService, popupService, profileService, ongoingProcess, walletService, platformInfo) {

  var amount;
  var currency;

  $scope.isCordova = platformInfo.isCordova;

  var showErrorAndBack = function(err) {
    $scope.sendStatus = '';
    $log.error(err);
    err = err.errors ? err.errors[0].message : err || '';
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
    if ( processName == 'buyingBitcoin' && !isOn) {
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
    var parsedAmount = glideraService.parseAmount(
      data.stateParams.amount, 
      data.stateParams.currency);

    amount = parsedAmount.amount;
    currency = parsedAmount.currency;
    $scope.amountUnitStr = parsedAmount.amountUnitStr;

    $scope.network = glideraService.getNetwork();
    $scope.wallets = profileService.getWallets({
      onlyComplete: true,
      network: $scope.network
    });
    $scope.wallet = $scope.wallets[0]; // Default first wallet

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
      glideraService.buyPrice($scope.token, price, function(err, buy) {
        ongoingProcess.set('connectingGlidera', false);
        if (err) {
          showErrorAndBack(err);
          return;
        }
        $scope.buyInfo = buy;
      });
    });
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

  $scope.buyConfirm = function() {
    var message = 'Buy bitcoin for ' + amount + ' ' + currency;
    var okText = 'Confirm';
    var cancelText = 'Cancel';
    popupService.showConfirm(null, message, okText, cancelText, function(ok) {
      if (!ok) return; 
      ongoingProcess.set('buyingBitcoin', true, statusChangeHandler);
      glideraService.get2faCode($scope.token, function(err, tfa) {
        if (err) {
          ongoingProcess.set('buyingBitcoin', false, statusChangeHandler);
          showError(err);
          return;
        }
        ask2FaCode(tfa.mode, function(twoFaCode) {
          if (tfa.mode != 'NONE' && lodash.isEmpty(twoFaCode)) {
            ongoingProcess.set('buyingBitcoin', false, statusChangeHandler);
            showError('No code entered');
            return;
          }

          walletService.getAddress($scope.wallet, false, function(err, walletAddr) {
            if (err) {
              ongoingProcess.set('buyingBitcoin', false, statusChangeHandler);
              showError(err);
              return;
            }
            var data = {
              destinationAddress: walletAddr,
              qty: $scope.buyInfo.qty,
              priceUuid: $scope.buyInfo.priceUuid,
              useCurrentPrice: false,
              ip: null
            };
            glideraService.buy($scope.token, twoFaCode, data, function(err, data) {
              ongoingProcess.set('buyingBitcoin', false, statusChangeHandler);
              if (err) return showError(err);
              $log.info(data);
            });
          });
        });
      });
    });
  };

  $scope.showWalletSelector = function() {
    $scope.walletSelectorTitle = 'Receive in';
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
      $state.transitionTo('tabs.buyandsell.glidera');
    });
  };
});
