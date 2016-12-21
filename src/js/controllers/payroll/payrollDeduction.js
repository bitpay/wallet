'use strict';

angular.module('copayApp.controllers').controller('payrollDeductionController', function($scope, $log, $http, $timeout, $ionicScrollDelegate, $ionicHistory, $state, lodash, bitpayPayrollService, txFormatService, profileService, configService, walletService, gettextCatalog, rateService, bwcService, popupService) {

  var config = configService.getSync().wallet.settings;

  var ADDRESS_VERIFIED_TITLE                = gettextCatalog.getString('Address Verified');
  var ADDRESS_NOT_VERIFIED_TITLE            = gettextCatalog.getString('Address Not Verified');
  var ADDRESS_VERIFIED                      = gettextCatalog.getString('This deposit address was verified automatically to be owned by you and associated with the specified wallet.');
  var ADDRESS_VERIFIED_MANUALLY             = gettextCatalog.getString('This deposit address was manually verified by you to be correct.');
  var ADDRESS_NOT_VERIFIED_RECOMMENDATION   = gettextCatalog.getString('If you cannot manually verify that your deposit address is correct then you should update your deposit wallet and/or address immediatley.<br/><br/>*This condition is informative only.');
  var ADDRESS_NOT_VERIFIED_WALLET_EXTERNAL  = gettextCatalog.getString('We are unable to verify this deposit address.<br/><br/>The specified wallet is not known by this app.<br/><br/>' + ADDRESS_NOT_VERIFIED_RECOMMENDATION);
  var ADDRESS_NOT_VERIFIED_NOT_IN_WALLET    = gettextCatalog.getString('We are unable to verify this deposit address.<br/><br/>The address is not associated with the specified wallet.<br/><br/>' + ADDRESS_NOT_VERIFIED_RECOMMENDATION);
  var ADDRESS_NOT_VERIFIED_ADDRESS_UNKNOWN  = gettextCatalog.getString('We are unable to verify this deposit address. ' + ADDRESS_NOT_VERIFIED_RECOMMENDATION);
  var BUTTON_OK                             = gettextCatalog.getString('Go Back');
  var BUTTON_ACCEPT_UNVERIFIED              = gettextCatalog.getString('Use My Address');
  var CANCEL_DEDUCTION_TITLE                = gettextCatalog.getString('Cancel Deduction');
  var CANCEL_DEDUCTION_MESSAGE              = gettextCatalog.getString('Are you sure you want to cancel your payroll deduction?');
  var BUTTON_YES                            = gettextCatalog.getString('Yes');
  var BUTTON_NO                             = gettextCatalog.getString('No');

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    $scope.wallets = profileService.getWallets({
      onlyComplete: true,
      network: 'livenet'
    });

    bitpayPayrollService.fetchDeduction(function(err, deduction) {
      if (err) {
        $log.error(err);
        return showError(null, gettextCatalog.getString('Failed to retrieve deduction information.') + '<br/><br/>' + err.message);
      }

      verifyAddress(deduction.address, deduction.walletId, deduction.unverifiedAddressAccepted);

      var depositAmount = parseFloat(deduction.amount);
      var btcEstimate = rateService.fromFiat(depositAmount, config.alternativeIsoCode);
      var btcEstimateStr = txFormatService.formatAmountStr(btcEstimate);

      $scope.address = deduction.address;
      $scope.depositAmount = depositAmount.toFixed(2);
      $scope.depositDisplayUnit = config.alternativeIsoCode;
      $scope.btcEstimate = getDisplayAmount(btcEstimateStr);
      $scope.btcDisplayUnit = getDisplayUnit(btcEstimateStr);
      $scope.unverifiedAddressAccepted = deduction.unverifiedAddressAccepted;
      $scope.externalWalletName = deduction.externalWalletName;

      rateService.whenAvailable(function() {
        $scope.exchangeRate = getCurrentRateStr();
      });
    });
  });

  function verifyAddress(address, walletId, unverifiedAddressAccepted) {
    $scope.wallet = undefined;

    if (walletId) {
      // Verify that the wallet is stored locally.
	    var wallet = lodash.find($scope.wallets, function(w) {
	    	return w.id == walletId;
	    });

      if (wallet) {
        $scope.wallet = wallet;

        // Verify that the address is contained in the specified wallet.
//        var addressObj = bwcService.getClient().getAddressFromWallet(walletId, address);
        var addressObj = {};

        if (addressObj) {
          $scope.verifyMessage = ADDRESS_VERIFIED;
          $scope.verified = true;
          $log.info('Payroll deposit address not in specified wallet. address: ' + address + ',  wallet: ' + walletId);
        } else {
          $scope.verifyMessage = ADDRESS_NOT_VERIFIED_NOT_IN_WALLET;
          $scope.verified = false;
          $log.warn('Payroll deposit address not in specified wallet. address: ' + address + ',  wallet: ' + walletId);
        }
      } else {
        $scope.verifyMessage = ADDRESS_NOT_VERIFIED_WALLET_EXTERNAL;
        $scope.verified = false;
        $log.warn('Payroll deposit wallet is external.');
      }
    } else {
    	// User provided an address only, not a wallet.
      $scope.verifyMessage = ADDRESS_NOT_VERIFIED_ADDRESS_UNKNOWN;
      $scope.verified = false;
      $log.warn('Payroll deposit address could not be verified. address: ' + address);
    }

    if (unverifiedAddressAccepted) {
      $scope.verifyMessage = ADDRESS_VERIFIED_MANUALLY;
      $scope.verified = true;
      $log.info('User accepted unverified payroll address: ' + address);
    }
  };

  function manuallyVerifyAddress() {
    var deductionChanges = {
      unverifiedAddressAccepted: true
    };
    bitpayPayrollService.updateDeduction(deductionChanges, function(err, deduction) {
      if (err) {
        $log.error(err);
        return showError();
      }
      if (deduction.unverifiedAddressAccepted) {
        $scope.unverifiedAddressAccepted = deduction.unverifiedAddressAccepted;
        $scope.verifyMessage = ADDRESS_VERIFIED_MANUALLY;
        $scope.verified = true;
      }
    });
  };

  function getDisplayAmount(amountStr) {
    return amountStr.split(' ')[0];
  };

  function getDisplayUnit(amountStr) {
    return amountStr.split(' ')[1];
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

  $scope.showError = function(title, message) {
    var title = title || gettextCatalog.getString('Error');
    var message = message || gettextCatalog.getString('Failed to save changes to your deduction.');
    return popupService.showAlert(title, message);
  };

  $scope.showVerification = function() {
    if ($scope.verified) {
      return popupService.showAlert(ADDRESS_VERIFIED_TITLE, $scope.verifyMessage);
    } else {
      return popupService.showConfirm(ADDRESS_NOT_VERIFIED_TITLE, $scope.verifyMessage, BUTTON_ACCEPT_UNVERIFIED, BUTTON_OK, function(acceptUnverifiedAddress) {
        if (acceptUnverifiedAddress) {
          manuallyVerifyAddress();
        }
      });
    }
  };

  $scope.editDeduction = function() {
    return $state.transitionTo('tabs.payroll.depositAddress');
  };

  $scope.cancelDeduction = function() {
    popupService.showConfirm(CANCEL_DEDUCTION_TITLE, CANCEL_DEDUCTION_MESSAGE, BUTTON_YES, BUTTON_NO, function(cancelDeduction) {
      if (cancelDeduction) {
        bitpayPayrollService.stopDeduction(function(err) {
          if (err) {
            $log.error(err);
            return showError();
          }
          $state.transitionTo('tabs.payroll');          
        });
      }
    });
  };

  function returnToState(name) {
    for( var viewObj in $ionicHistory.viewHistory().views) {
      if( $ionicHistory.viewHistory().views[viewObj].stateName == name ) {
        $ionicHistory.backView($ionicHistory.viewHistory().views[viewObj]);
      }
    }
    $ionicHistory.goBack();
  };

  $scope.goBackToSettings = function() {
    returnToState('tabs.settings');
  };

});
