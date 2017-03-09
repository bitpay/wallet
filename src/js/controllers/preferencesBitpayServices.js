'use strict';

angular.module('copayApp.controllers').controller('preferencesBitpayServicesController',
  function($rootScope, $scope, $state, $timeout, $ionicHistory, bitpayAccountService, bitpayCardService, bitpayPayrollService, popupService, gettextCatalog) {

    $scope.removeAccount = function(account) {
      var title = gettextCatalog.getString('Remove BitPay Account?');
      var msg = gettextCatalog.getString('Removing your BitPay account will remove all associated BitPay account data from this device. Are you sure you would like to remove your BitPay Account ({{email}}) from this device?', {
        email: account.email
      });
      popupService.showConfirm(title, msg, null, null, function(res) {
        if (res) {
          removeAccount(account);
        }
      });
    };

    $scope.removeCard = function(card) {
      var title = gettextCatalog.getString('Remove BitPay Card?');
      var msg = gettextCatalog.getString('Are you sure you would like to remove your BitPay Card ({{lastFourDigits}}) from this device?', {
        lastFourDigits: card.lastFourDigits
      });
      popupService.showConfirm(title, msg, null, null, function(res) {
        if (res) {
          removeCard(card);
        }
      });
    };

    $scope.removePayrollRecord = function(record) {
      var title = gettextCatalog.getString('Remove Payroll Record?');
      var msg = gettextCatalog.getString('Are you sure you would like to remove this payroll record ({{employerName}}) from this device?', {
        employerName: record.employer.name
      });
      popupService.showConfirm(title, msg, null, null, function(res) {
        if (res) {
          removePayrollRecord(record.id);
        }
      });
    };

    var removeAccount = function(account) {
      bitpayAccountService.removeAccount(account, function(err) {
        if (err) {
          return popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Could not remove account.'));
        }
        setScope(function() {
          // If there are no paired accounts then change views.
          if ($scope.accounts.length == 0) {
            $state.go('tabs.settings').then(function() {
              $ionicHistory.clearHistory();
              $state.go('tabs.home');
            });
          }
        });
      });
    };

    var removeCard = function(card) {
      bitpayCardService.remove(card.id, function(err) {
        if (err) {
          return popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Could not remove card.'));
        }
        setScope();
      });
    };

    var removePayrollRecord = function(id) {
      bitpayPayrollService.removePayrollRecord(id, function(err) {
        if (err) {
          return popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Could not remove payroll settings.'));
        }
        setScope();
      });
    };

    var setScope = function(cb) {
      bitpayCardService.getCards(function(err, cards) {
        $scope.cards = cards;
      });

      bitpayPayrollService.getPayrollRecords(null, function(err, records) {
        $scope.payrollRecords = records;
      });

      bitpayAccountService.getAccounts(function(err, accounts) {
        $scope.accounts = accounts;
      });
    };

    $scope.$on("$ionicView.beforeEnter", function(event, data) {
      setScope();
    });

  });
