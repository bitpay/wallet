'use strict';

angular.module('copayApp.controllers').controller('payrollDetailsController', function($scope, $log, $ionicHistory, $state, lodash, bitpayPayrollService, txFormatService, configService, profileService, gettextCatalog, rateService, popupService) {

  var config = configService.getSync().wallet.settings;

  var ADDRESS_NOT_VERIFIED_TITLE = gettextCatalog.getString('Address Not Verified');
  var ADDRESS_VERIFIED_TITLE     = gettextCatalog.getString('Address Verified');
  var BUTTON_ACCEPT_UNVERIFIED   = gettextCatalog.getString('Use My Address');
  var BUTTON_OK                  = gettextCatalog.getString('Go Back');
  var BUTTON_NO                  = gettextCatalog.getString('No');
  var BUTTON_YES                 = gettextCatalog.getString('Yes');
  var BUTTON_PAUSE               = gettextCatalog.getString('Pause');
  var BUTTON_RESUME              = gettextCatalog.getString('Resume');
  var PAUSE_PAYROLL_TITLE        = gettextCatalog.getString('Pause Payroll');
  var PAUSE_PAYROLL_MESSAGE      = gettextCatalog.getString('Are you sure you want to pause your bitcoin payroll? You can resume payroll with the same settings later.');
  var STOP_PAYROLL_TITLE         = gettextCatalog.getString('Cancel Payroll');
  var STOP_PAYROLL_MESSAGE       = gettextCatalog.getString('Are you sure you want to cancel your bitcoin payroll?');

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    if (data.stateParams && data.stateParams.id) {

      bitpayPayrollService.getPayrollRecords(function(err, records) {
        if (err) {
          return showError(err);
        }

        var record = $scope.payrollRecord = lodash.find(records, function(r) {
          return r.id == data.stateParams.id;
        });

        if (!$scope.payrollRecord) {
          return showError(
            'No payroll record found when loading payrollConfirmController',
            gettextCatalog.getString('Error'),
            gettextCatalog.getString('No payroll settings specified.'));
        }

        var btcEstimate = rateService.fromFiat(parseFloat(record.deduction.amount), config.alternativeIsoCode);
        var btcEstimateStr = txFormatService.formatAmountStr(btcEstimate);

        $scope.btcEstimate = getDisplayAmount(btcEstimateStr);
        $scope.btcDisplayUnit = getDisplayUnit(btcEstimateStr);

        rateService.whenAvailable(function() {
          $scope.exchangeRate = getCurrentRateStr();
        });

        $scope.wallet = profileService.getWallet(record.deduction.walletId);
        $scope.payrollStateButtonText = (record.deduction.active ? BUTTON_PAUSE : BUTTON_RESUME);
      });
    } else {
      return showError(
        'No payroll record id specified when loading payrollConfirmController',
        gettextCatalog.getString('Error'),
        gettextCatalog.getString('No payroll settings specified.'));
    }
  });

  $scope.showVerification = function() {
    var verification = $scope.payrollRecord.deduction.addressVerification;
    if (verification.verified) {
      return popupService.showAlert(ADDRESS_VERIFIED_TITLE, verification.message);
    } else {
      return popupService.showConfirm(ADDRESS_NOT_VERIFIED_TITLE, verification.message, BUTTON_ACCEPT_UNVERIFIED, BUTTON_OK, function(res) {
        if (res) {
          bitpayPayrollService.manuallyVerifyAddress($scope.payrollRecord, function(err, record) {
            if (err) {
              return showError(err);
            }
            $scope.payrollRecord = record;
          });
        }
      });
    }
  };

  $scope.changePayroll = function() {
    return $state.transitionTo('tabs.payroll.depositAddress', {
      id: $scope.payrollRecord.id
    });
  };

  $scope.togglePausePayroll = function() {
    if ($scope.payrollRecord.deduction.active) {
      popupService.showConfirm(PAUSE_PAYROLL_TITLE, PAUSE_PAYROLL_MESSAGE, BUTTON_YES, BUTTON_NO, function(res) {
        if (res) {
          bitpayPayrollService.pausePayroll($scope.payrollRecord, function(err, record) {
            if (err) {
              return showError(err);
            }
            $scope.payrollRecord = record;
            $scope.payrollStateButtonText = (record.deduction.active ? BUTTON_PAUSE : BUTTON_RESUME);
          });
        }
      });
    } else {
      // Don't confirm resuming payroll, just do it.
      bitpayPayrollService.startPayroll($scope.payrollRecord, function(err, record) {
        if (err) {
          return showError(err);
        }
        $scope.payrollRecord = record;
        $scope.payrollStateButtonText = (record.deduction.active ? BUTTON_PAUSE : BUTTON_RESUME);
      });
    }
  };

  $scope.stopPayroll = function() {
    popupService.showConfirm(STOP_PAYROLL_TITLE, STOP_PAYROLL_MESSAGE, BUTTON_YES, BUTTON_NO, function(res) {
      if (res) {
        bitpayPayrollService.stopPayroll($scope.payrollRecord, function(err, record) {
          if (err) {
            return showError(err);
          }
          $state.transitionTo('tabs.home');
        });
      }
    });
  };

  $scope.goBackToHome = function() {
    returnToState('tabs.home');
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

  function returnToState(name) {
    for(var viewObj in $ionicHistory.viewHistory().views) {
      if ($ionicHistory.viewHistory().views[viewObj].stateName == name) {
        $ionicHistory.backView($ionicHistory.viewHistory().views[viewObj]);
      }
    }
    $ionicHistory.goBack();
  };

  function showError(err, title, message) {
    var title = title || gettextCatalog.getString('Error');
    var message = message || gettextCatalog.getString('Could not save payroll settings.');
    $log.error(err);
    return popupService.showAlert(title, message);
  };

});
