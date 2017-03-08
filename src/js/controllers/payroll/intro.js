'use strict';

angular.module('copayApp.controllers').controller('payrollIntroController', function($scope, $state, $ionicHistory, configService, externalLinkService, gettextCatalog, bitpayAccountService, bitpayPayrollService, popupService, storageService) {

  var accountSelectDest = undefined;

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    if (data.stateParams && data.stateParams.secret) {
      var pairData = {
        secret: data.stateParams.secret,
        email: data.stateParams.email,
        otp: data.stateParams.otp
      };
      bitpayAccountService.pair(pairData, function(err, paired, apiContext) {
        if (err) {
          return popupService.showAlert(gettextCatalog.getString('Error'), err);
        }
        if (paired) {
          return startPayrollSetup(pairData.email);
        }
      });
    }

    bitpayAccountService.getAccounts(function(err, accounts) {
      if (err) {
        return popupService.showAlert(gettextCatalog.getString('Error'), err);
      }
      $scope.accounts = accounts;
      $scope.hasAccount = (accounts.length > 0);
    });
  });

  $scope.payrollInfo = function() {
    var url = 'https://bitpay.com/payroll';
    externalLinkService.open(url);
  };

  $scope.setupPayroll = function() {
    $scope.accountSelectorTitle = gettextCatalog.getString('On BitPay account');
    showAccountSelector('setup');
  };

  $scope.connectPayroll = function() {
    if ($scope.accounts.length == 0) {
      startPairBitPayAccount();
    } else {
     $scope.accountSelectorTitle = gettextCatalog.getString('From BitPay account');
      showAccountSelector('connect');
    }
  };

  var startPairBitPayAccount = function() {
    bitpayAccountService.startPairBitPayAccount('payroll');
  };

  var startPayrollSetup = function(email) {
    root.getAccount(email, function(err, account) {
      if (err) {
        return popupService.showAlert(gettextCatalog.getString('Error'), err);
      }
      bitpayPayrollService.bindToBitPayAccount(account);
      $state.transitionTo('tabs.payroll.eligible');
    });
  };

  var showAccountSelector = function(dest) {
    accountSelectDest = dest;
    $scope.showAccounts = ($scope.accounts != undefined);
  };

  $scope.onAccountSelect = function(account) {
    if (account == undefined) {
      // 'Add account' selected.
      // A new account will be created later using the verified email address.
      $state.transitionTo('tabs.payroll.eligible');

    } else {

      switch (accountSelectDest) {
        case 'connect':
          bitpayPayrollService.fetchPayrollRecords(account.apiContext, function(err, data) {
            if (err) {
              popupService.showAlert(gettextCatalog.getString('Error'), err);
              return;
            }
          });
          break;
        case 'setup':
        default:
          bitpayPayrollService.bindToBitPayAccount(account);
          $state.transitionTo('tabs.payroll.eligible');
          break;
      }
      accountSelectDest = undefined;
    }
  };

  function returnToState(name) {
    for( var viewObj in $ionicHistory.viewHistory().views) {
      if( $ionicHistory.viewHistory().views[viewObj].stateName == name ) {
        $ionicHistory.backView($ionicHistory.viewHistory().views[viewObj]);
      }
    }
    $ionicHistory.goBack();
  };

  $scope.goBackToHome = function() {
    returnToState('tabs.home');
  };

});
