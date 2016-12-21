'use strict';

angular.module('copayApp.controllers').controller('payrollConfirmController', function($scope, $log, $state, $timeout, $ionicScrollDelegate, lodash, bitpayPayrollService, txFormatService, profileService, configService, walletService, gettextCatalog, rateService, popupService, moment) {

  var BITPAY_API_URL = 'https://bitpay.com';
  var config = configService.getSync().wallet.settings;

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
  	// Deposit amount is in fiat (alternative) currency.
    var depositAmount = parseFloat(data.stateParams.depositAmount);
    var btcEstimate = rateService.fromFiat(depositAmount, config.alternativeIsoCode);
    var btcEstimateStr = txFormatService.formatAmountStr(btcEstimate);

    $scope.depositAmount = depositAmount.toFixed(2);
    $scope.depositDisplayUnit = config.alternativeIsoCode;
    $scope.btcEstimate = getDisplayAmount(btcEstimateStr);
    $scope.btcDisplayUnit = getDisplayUnit(btcEstimateStr);
    $scope.externalWalletName = gettextCatalog.getString('My External Wallet');

    $scope.wallets = profileService.getWallets({
      onlyComplete: true,
      network: 'livenet'
    });

    var isWallet = (data.stateParams.isWallet.trim().toLowerCase() == 'true' ? true : false);
    if (isWallet) {
	    var wallet = lodash.find($scope.wallets, function(w) {
	    	return w.name == data.stateParams.toName;
	    });
	    setWallet(wallet);
    } else {
    	// User provided an address, not a wallet.
	    $scope.address = data.stateParams.toAddress;
    }

    rateService.whenAvailable(function() {
      $scope.exchangeRate = getCurrentRateStr();
    });

    bitpayPayrollService.fetchEffectiveDate(function(err, date) {
      $scope.effectiveDate = getEffectiveDateStr(date);
    });
  });

  function getDisplayAmount(amountStr) {
    return amountStr.split(' ')[0];
  };

  function getDisplayUnit(amountStr) {
    return amountStr.split(' ')[1];
  };

  function setWallet(wallet) {
    $scope.address = '';
    $scope.wallet = wallet;

    walletService.getAddress(wallet, false, function(err, addr) {
      if (err || !addr) {
        $log.error(err);
        return;
      }
      $log.debug('Got payroll deposit address:' + addr + ' | ' + wallet.name);
	    $scope.address = addr;
		
		  $timeout(function() {
		    $ionicScrollDelegate.resize();
		    $scope.$apply();
		  }, 10);
    });
  };

  function getCurrentRateStr() {    
    var str = '';
    var config = configService.getSync().wallet.settings;
    var rate = rateService.getRate(config.alternativeIsoCode);

    if (config.unitName == 'bits') {
      str = '1,000,000 bits ~ ' + rate + ' ' + config.alternativeIsoCode;
    } else {
      str = '1 BTC ~ ' + rate + ' ' + config.alternativeIsoCode;
    }
    return str;
  };

  function getEffectiveDateStr(date) {
    return moment(date).format('D MMMM YYYY');
  };

  function showError(title, message) {
    var title = title || gettextCatalog.getString('Error');
    var message = message || gettextCatalog.getString('Failed to save your deduction.');
    return popupService.showAlert(title, message);
  };

  $scope.showWalletSelector = function() {
    $scope.walletSelectorTitle = gettextCatalog.getString('Deposit to');
    $scope.showWallets = true;
  };

  $scope.onWalletSelect = function(wallet) {
    setWallet(wallet);
  };

  $scope.renameExternalWallet = function() {
    var opts = {
      defaultText: $scope.externalWalletName
    };
    popupService.showPrompt(gettextCatalog.getString('External Wallet Name'), null, opts, function(str) {
      if (typeof str != 'undefined') {
        $scope.externalWalletName = str;
      }
    });    
  };

  $scope.confirmDeduction = function() {
    // Store what we show the user ($scope).
  	var deduction = {
      active: true,
      address: $scope.address,
    	amount: parseFloat($scope.depositAmount),
    	currencyCode: $scope.depositDisplayUnit,
      walletId: ($scope.wallet ? $scope.wallet.id : ''),
      externalWalletName: $scope.externalWalletName
    };

    bitpayPayrollService.startDeduction(deduction, function(err, deduction) {
      if (err) {
        $log.error(err);
        return showError();
      }
      $log.info('Payroll deduction: ' +
        deduction.amount.toFixed(2) + ' ' +
        deduction.currencyCode + ' -> ' +
        deduction.address +
        ' (active: ' + deduction.active + ')');

      $state.transitionTo('tabs.payroll.deduction');
    });
  };

});
