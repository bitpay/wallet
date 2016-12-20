'use strict';

angular.module('copayApp.controllers').controller('payrollDeductionController', function($scope, $log, $http, $timeout, $ionicScrollDelegate, lodash, txFormatService, profileService, configService, walletService, gettextCatalog, rateService, bwcService, popupService) {

  var config = configService.getSync().wallet.settings;


  var ADDRESS_VERIFIED_TITLE               = gettextCatalog.getString('Address Verified');
  var ADDRESS_NOT_VERIFIED_TITLE           = gettextCatalog.getString('Address Not Verified');
  var ADDRESS_VERIFIED                     = gettextCatalog.getString('This deposit address was verified automatically to be owned by you and associated with the specified wallet.');
  var ADDRESS_VERIFIED_MANUALLY            = gettextCatalog.getString('This deposit address was manually verified by you to be correct.');
  var ADDRESS_NOT_VERIFIED_RECOMMENDATION  = gettextCatalog.getString('If you cannot manually verify your deposit address is correct then you should update your deposit wallet and/or address immediately.');
  var ADDRESS_NOT_VERIFIED_WALLET_UNKNOWN  = gettextCatalog.getString('We are unable to verify this deposit address.<br/><br/>The specified Wallet is not stored locally in this app.<br/><br/>' + ADDRESS_NOT_VERIFIED_RECOMMENDATION);
  var ADDRESS_NOT_VERIFIED_NOT_IN_WALLET   = gettextCatalog.getString('We are unable to verify this deposit address.<br/><br/>The address is not associated with the specified wallet.<br/><br/>' + ADDRESS_NOT_VERIFIED_RECOMMENDATION);
  var ADDRESS_NOT_VERIFIED_ADDRESS_UNKNOWN = gettextCatalog.getString('We are unable to verify this deposit address. ' + ADDRESS_NOT_VERIFIED_RECOMMENDATION);
  var BUTTON_OK                            = gettextCatalog.getString('OK');
  var BUTTON_OK_DONT_ASK_AGAIN             = gettextCatalog.getString('Mute Warning');


  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    $scope.wallets = profileService.getWallets({
      onlyComplete: true,
      network: 'livenet'
    });

    var deduction = getPayrollDeduction();
    var depositAmount = parseFloat(deduction.amount);
    var btcEstimate = rateService.fromFiat(depositAmount, config.alternativeIsoCode);
    var btcEstimateStr = txFormatService.formatAmountStr(btcEstimate);

    $scope.address = deduction.address;
    $scope.exchangeRate = getCurrentRateStr();
    $scope.depositAmount = depositAmount.toFixed(2) + ' ' + config.alternativeIsoCode;
    $scope.btcEstimate = getDisplayAmount(btcEstimateStr);
    $scope.btcDisplayUnit = getDisplayUnit(btcEstimateStr);
    $scope.unverifiedAddressAccepted = configService.getSync().payroll.unverifiedAddressAccepted;
  });

  function getPayrollDeduction() {
    // TODO: retrieve from bitpay server.
    return verifyAddress({
      amount: 10,
      currencyCode: 'USD',
      address: '1ApLN1BJw2DUZ17ofH9xq59P7Jc9vMGSYe',
      walletId: '13f68a06-4299-4ed6-8fe6-323298759b16'
    });
  };

  function verifyAddress(deduction) {
    $scope.wallet = undefined;

    if (deduction.walletId) {
      // Verify that the wallet is stored locally.
	    var wallet = lodash.find($scope.wallets, function(w) {
	    	return w.id == deduction.walletId;
	    });

      if (wallet) {
        $scope.wallet = wallet;

        // Verify that the address is contained in the specified wallet.
//        var address = bwcService.getClient().getAddressFromWallet(deduction.walletId, deduction.address);
        var address = {};

        if (address) {
          $scope.verifyMessage = ADDRESS_VERIFIED;
          $scope.verified = true;
          $log.info('Payroll deposit address not in specified wallet. address: ' + deduction.address + ',  wallet: ' + deduction.walletId);
        } else {
          $scope.verifyMessage = ADDRESS_NOT_VERIFIED_NOT_IN_WALLET;
          $scope.verified = false;
          $log.warn('Payroll deposit address not in specified wallet. address: ' + deduction.address + ',  wallet: ' + deduction.walletId);
        }
      } else {
        $scope.verifyMessage = ADDRESS_NOT_VERIFIED_WALLET_UNKNOWN;
        $scope.verified = false;
        $log.warn('Payroll deposit wallet unknown. wallet: ' + deduction.walletId);
      }
    } else {
    	// User provided an address only, not a wallet.
      $scope.verifyMessage = ADDRESS_NOT_VERIFIED_ADDRESS_UNKNOWN;
      $scope.verified = false;
      $log.warn('Payroll deposit address could not be verified. address: ' + deduction.address);
    }

    if (configService.getSync().payroll.unverifiedAddressAccepted) {
      $scope.verifyMessage = ADDRESS_VERIFIED_MANUALLY;
      $scope.verified = true;
      $log.info('User accepted unverified payroll address: ' + deduction.address);
    }
    return deduction;
  };

  function manuallyVerifyAddress() {
    var opts = {
      payroll: {
        unverifiedAddressAccepted: true
      }
    };
    configService.set(opts, function(err) {
      if (err) $log.warn(err);
      if (configService.getSync().payroll.unverifiedAddressAccepted) {
        $scope.unverifiedAddressAccepted = configService.getSync().payroll.unverifiedAddressAccepted;
        $scope.verifyMessage = ADDRESS_VERIFIED_MANUALLY;
        $scope.verified = true;
        $log.info('User accepted unverified payroll address: ' + $scope.address);
      }
    });
  };

  function getDisplayAmount(amountStr) {
    return amountStr.split(' ')[0];
  };

  function getDisplayUnit(amountStr) {
    return amountStr.split(' ')[1];
  };

  function validateAddressWithWallet(wallet, address) {
    walletService.getAddress(wallet, false, function(err, addr) {
      if (err || !addr) {
        $log.error(err);
        return;
      }
      $log.debug('Got payroll deposit address:' + addr + ' | ' + wallet.name);
    });
  };

  function getCurrentRateStr() {
    var str = '';
    var rate = rateService.getRate(config.alternativeIsoCode);

    if (config.unitName == 'bits') {
      str = '1,000,000 bits ~ ' + rate + ' ' + config.alternativeIsoCode;
    } else {
      str = '1 BTC ~ ' + rate + ' ' + config.alternativeIsoCode;
    }
    return str;
  };

  $scope.showVerification = function() {
    if ($scope.verified) {
      return popupService.showAlert(ADDRESS_VERIFIED_TITLE, $scope.verifyMessage);
    } else {
      return popupService.showConfirm(ADDRESS_NOT_VERIFIED_TITLE, $scope.verifyMessage, BUTTON_OK_DONT_ASK_AGAIN, BUTTON_OK, function(acceptUnverifiedAddress) {
        if (acceptUnverifiedAddress) {
          manuallyVerifyAddress();
        }
      });
    }
  };

  $scope.editDeduction = function() {
    return $state.transitionTo('tabs.payroll.depositAddress');
  };

});
