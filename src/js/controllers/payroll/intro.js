'use strict';

angular.module('copayApp.controllers').controller('payrollIntroController', function($scope, $state, $ionicHistory, configService, externalLinkService, gettextCatalog, bitpayService, bitpayAccountService, bitpayPayrollService, popupService, storageService) {

  var accountSelectDest = undefined;

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    if (data.stateParams && data.stateParams.secret) {
      var pairData = {
        secret: data.stateParams.secret,
        email: data.stateParams.email,
        otp: data.stateParams.otp,
        facade: data.stateParams.facade
      };
      bitpayAccountService.pair(pairData, function(err, paired, apiContext) {
        if (err) {
          return popupService.showAlert(gettextCatalog.getString('Error'), err);
        }
        if (paired) {
          return onAfterPairing(pairData.email);
        }
      });
    }

    updateAccounts();
  });

  $scope.payrollInfo = function() {
    var url = 'https://bitpay.com/payroll';
    externalLinkService.open(url);
  };

  $scope.setupPayroll = function() {
    $scope.accountSelectorTitle = gettextCatalog.getString('On BitPay account');
     $scope.accountSelectorItemLabel = gettextCatalog.getString('Create account');
    showAccountSelector('setup');
  };

  $scope.connectPayroll = function() {
    if ($scope.accounts.length == 0) {
      startPairBitPayAccount();
    } else {
     $scope.accountSelectorTitle = gettextCatalog.getString('From BitPay account');
     $scope.accountSelectorItemLabel = gettextCatalog.getString('Add account');
      showAccountSelector('connect');
    }
  };

  var updateAccounts = function(callback) {
    callback = callback || function(){};
    bitpayAccountService.getAccounts(function(err, accounts) {
      if (err) {
        return popupService.showAlert(gettextCatalog.getString('Error'), err);
      }
      $scope.accounts = accounts;
      $scope.hasAccount = (accounts.length > 0);
      return callback();
    });
  };

  var onAfterPairing = function(email) {
    updateAccounts(function() {
      // After pairing either show the summary view or stay here.
      bitpayAccountService.getAccount(email, function(err, account) {
        if (err) {
          return popupService.showAlert(gettextCatalog.getString('Error'), err);
        }

        if (account && bitpayPayrollService.hasAccess(account.apiContext)) {
          // Has an account with payroll access.
          bitpayPayrollService.getPayrollRecords(account.apiContext, function(err, records) {
            if (err) {
              return popupService.showAlert(gettextCatalog.getString('Error'), err);
            }

            if (records.length > 0) {
              $state.transitionTo('tabs.payroll.summary');
            }
          });
        }
      });
    });
  };

  var startPairBitPayAccount = function() {
    bitpayAccountService.startPairBitPayAccount(bitpayService.FACADE_PAYROLL_USER);
  };

  var showAccountSelector = function(dest) {
    accountSelectDest = dest;
    $scope.showAccounts = ($scope.accounts != undefined);
  };

  $scope.onAccountSelect = function(account) {
    if (!account) {
      bitpayPayrollService.unbindBitPayAccount();
    }

    switch (accountSelectDest) {
      case 'connect':
        if (account && bitpayPayrollService.hasAccess(account.apiContext)) {
          // Has an account with payroll access.
          bitpayPayrollService.getPayrollRecords(account.apiContext, function(err, records) {
            if (err) {
              return popupService.showAlert(gettextCatalog.getString('Error'), err);
            }

            if (records.length > 0) {
              // Show the records we found.
              return $state.transitionTo('tabs.payroll.summary');

            } else {
              // No records on account. Provide an option to begin setup.
              var title = gettextCatalog.getString('No Payroll Settings');
              var msg = gettextCatalog.getString('The selected BitPay account ({{email}}) does not have any payroll settings.  Would you like to setup payroll on this account?', {
                email: account.email
              });
              var ok = gettextCatalog.getString('Setup Payroll');
              var cancel = gettextCatalog.getString('Dismiss');

              return popupService.showConfirm(title, msg, ok, cancel, function(res) {
                if (res) {
                  bitpayPayrollService.bindToBitPayAccount(account);
                  $state.transitionTo('tabs.payroll.eligible', {createAccount: false});
                }
              });
            }
          });

        } else {
          return startPairBitPayAccount();
        }
        break;

      case 'setup':
      default:
        if (account && bitpayPayrollService.hasAccess(account.apiContext)) {
          // Has an account with payroll access.
          bitpayPayrollService.bindToBitPayAccount(account);
          $state.transitionTo('tabs.payroll.eligible', {createAccount: false});

        } else if (account) {
          // Has an account but no payroll access.
          return startPairBitPayAccount();

        } else {
          // 'Create account' selected.
          // A new account will be created later using the verified email address.
          $state.transitionTo('tabs.payroll.eligible', {createAccount: true});
        }
        break;
    }
    accountSelectDest = undefined;
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
