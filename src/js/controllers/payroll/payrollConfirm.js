'use strict';

angular.module('copayApp.controllers').controller('payrollConfirmController', function($scope, $log, $state, $timeout, $ionicScrollDelegate, lodash, txFormatService, profileService, configService, walletService, gettextCatalog, rateService) {

  var BITPAY_API_URL = 'https://bitpay.com';
  var config = configService.getSync().wallet.settings;
	var depositAmount;

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
  	// Deposit amount is in fiat (alternative) currency.
    depositAmount = parseFloat(data.stateParams.depositAmount);
    $scope.depositAmount = depositAmount.toFixed(2) + ' ' + config.alternativeIsoCode;

    var btcEstimate = rateService.fromFiat(depositAmount, config.alternativeIsoCode);
    var btcEstimateStr = txFormatService.formatAmountStr(btcEstimate);
    $scope.btcEstimate = getDisplayAmount(btcEstimateStr);
    $scope.btcDisplayUnit = getDisplayUnit(btcEstimateStr);

    $scope.wallets = profileService.getWallets({
      onlyComplete: true,
      network: 'livenet'
    });

    $scope.isWallet = (data.stateParams.isWallet.trim().toLowerCase() == 'true' ? true : false);
    if ($scope.isWallet) {
	    var wallet = lodash.find($scope.wallets, function(w) {
	    	return w.name == data.stateParams.toName;
	    });
	    setWallet(wallet);
    } else {
    	// User provided an address, not a wallet.
	    $scope.address = data.stateParams.toAddress;
    }

    $scope.exchangeRate = getCurrentRateStr();
		$scope.effectiveDate = getPayrollEffectiveDateStr();
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
    $scope.isWallet = true;

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

  function getPayrollEffectiveDateStr() {
  	// TODO
  	return '23 December 2016';
  };

  function resetUnverifiedAddressAccepted() {
    var opts = {
      payroll: {
        unverifiedAddressAccepted: false
      }
    };
    configService.set(opts, function(err) {
      if (err) $log.warn(err);
    });
  };

  $scope.showWalletSelector = function() {
    $scope.walletSelectorTitle = gettextCatalog.getString('Deposit to');
    $scope.showWallets = true;
  };

  $scope.onWalletSelect = function(wallet) {
    setWallet(wallet);
  };

  $scope.confirmDeduction = function() {
  	var address = $scope.address;
  	var amount = depositAmount;
  	var currencyCode = config.alternativeIsoCode;

    resetUnverifiedAddressAccepted();
  	$log.info('Update payroll deduction: ' + amount.toFixed(2) + ' ' + currencyCode + ' -> ' + address);

  	// TODO - commit changes to the bitpay server
    // Set view busy while bitpay server safes deduction info 

		return $state.transitionTo('tabs.payroll.deduction');
 };

});
