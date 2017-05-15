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
    $scope.accountSelectorItems = [
      {
        label: gettextCatalog.getString('Create account'),
        icon: 'img/icon-account-add.svg'
      },
      {
        label: gettextCatalog.getString('Connect account'),
        icon: 'img/icon-account-link.svg'
      }
    ];
    showAccountSelector('setup');
  };

  $scope.connectPayroll = function() {
    if ($scope.accounts.length == 0) {
      startPairBitPayAccount();
    } else {
      $scope.accountSelectorTitle = gettextCatalog.getString('From BitPay account');
      $scope.accountSelectorItems = [
        {
          label: gettextCatalog.getString('Connect account'),
          icon: 'img/icon-account-link.svg'
        }
      ];
      showAccountSelector('connect');
    }
  };

  $scope.onSelect = function(accountOrIndex) {
    if (isNaN(accountOrIndex)) {
      doOnAccountSelect(parseInt(accountOrIndex));
    } else {
      doOnItemSelect(accountOrIndex);
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
    // After pairing show the summary view if there are existing payroll records.
    // If there are no payroll records then advance to the start of payroll setup.
    updateAccounts(function() {
      if (bitpayPayrollService.hasAccess(email)) {
        // Has an account with payroll access.
        bitpayPayrollService.getPayrollRecords(email, function(err, records) {
          if (err) {
            return popupService.showAlert(gettextCatalog.getString('Error'), err);
          }

          if (records.length > 0) {
            $state.transitionTo('tabs.payroll.summary');
          } else {
            $state.transitionTo('tabs.payroll.eligible');
          }
        });
      }
      // No accounts with payroll access. Just stay on this view.
      // (this shouldn't happen)
    });
  };

  var startPairBitPayAccount = function() {
    bitpayAccountService.startPairBitPayAccount(bitpayService.FACADE_PAYROLL_USER);
  };

  var showAccountSelector = function(dest) {
    accountSelectDest = dest;
    $scope.showAccounts = ($scope.accounts != undefined);
  };

  var doOnItemSelect = function(index) {
    bitpayPayrollService.unbindBitPayAccount();

    // Index one of the item choices.
    switch (index) {
      case 0:
        // 'Create account' selected.
        // A new account will be created later using the verified email address.
        $state.transitionTo('tabs.payroll.eligible', {createAccount: true});
        break;

      case 1:
      default:
        // 'Connect account' selected.
        // Start pairing process for unknown account.
        return startPairBitPayAccount();
        break;
    }
  };

  var doOnAccountSelect = function(account) {
    switch (accountSelectDest) {
      case 'connect':
        if (account && bitpayPayrollService.hasAccess(account)) {
          // Has an account with payroll access.
          bitpayPayrollService.getPayrollRecords(account, function(err, records) {
            if (err) {
              return popupService.showAlert(gettextCatalog.getString('Error'), err);
            }

            if (records.length > 0) {
              // Show the records we found.
              return $state.transitionTo('tabs.payroll.summary');

            } else {
              // No records on account. Provide an option to begin setup.
              var title = gettextCatalog.getString('No Payroll Settings');
              var msg = gettextCatalog.getString('The selected BitPay account ({{email}}) does not have any payroll settings to connect.  Would you like to setup payroll on this account?', {
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
          // Start pairing process for unknown account.
          return startPairBitPayAccount();
        }
        break;

      case 'setup':
      default:
        if (account && bitpayPayrollService.hasAccess(account)) {
          // Has an account with payroll access.
          bitpayPayrollService.bindToBitPayAccount(account);
          $state.transitionTo('tabs.payroll.eligible', {createAccount: false});

        } else {
          // Has an account but no payroll access.
          // Ask if the user wants to add payroll access to this account.
          var title = gettextCatalog.getString('No Payroll Access');
          var msg = gettextCatalog.getString('Do you want to setup access for this BitPay account ({{email}}) to share payroll information with this device?', {
            email: account.email
          });
          var ok = gettextCatalog.getString('Yes');
          var cancel = gettextCatalog.getString('No');

          return popupService.showConfirm(title, msg, ok, cancel, function(res) {
            if (res) {
              return startPairBitPayAccount();
            }
          });
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
