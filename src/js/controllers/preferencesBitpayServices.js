'use strict';

angular.module('copayApp.controllers').controller('preferencesBitpayServicesController',
  function($rootScope, $scope, $state, $timeout, $ionicHistory, lodash, bitpayAccountService, bitpayCardService, bitpayPayrollService, popupService, gettextCatalog) {

    $scope.removeAccount = function(account) {
      var title = gettextCatalog.getString('Unlink BitPay Account?');
      var msg = gettextCatalog.getString('Unlinking your BitPay account will remove all associated BitPay account data from this device. Are you sure you would like to unlink your BitPay Account ({{email}}) from this device?', {
        email: account.email
      });
      popupService.showConfirm(title, msg, null, null, function(res) {
        if (res) {
          removeAccount(account);
        }
      });
    };

    $scope.removeCard = function(card) {
      var title = gettextCatalog.getString('Unlink  BitPay Card?');
      var msg = gettextCatalog.getString('Are you sure you would like to unlink your BitPay Card ({{lastFourDigits}}) from this device?', {
        lastFourDigits: card.lastFourDigits
      });
      popupService.showConfirm(title, msg, null, null, function(res) {
        if (res) {
          removeCard(card);
        }
      });
    };

    $scope.removePayrollRecord = function(record) {
      var title = gettextCatalog.getString('Unlink Payroll Record?');
      var msg = gettextCatalog.getString('Are you sure you would like to unlink this payroll record ({{employerName}}) from this device?', {
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
          return popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Could not unlink account.'));
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
          return popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Could not unlink card.'));
        }
        setScope();
      });
    };

    var removePayrollRecord = function(id) {
      bitpayPayrollService.removePayrollRecord(id, function(err) {
        if (err) {
          return popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Could not unlink payroll record.'));
        }
        setScope();
      });
    };

    var setScope = function(cb) {
      cb = cb || function(){};

      bitpayCardService.getCards(function(err, cards) {
        $scope.cards = cards;

        bitpayPayrollService.getPayrollRecords(null, function(err, records) {
          $scope.payrollRecords = lodash.filter(records, function(record) {
            return record.token != undefined;
          });

          bitpayAccountService.getAccounts(function(err, accounts) {
            $scope.accounts = accounts;
            cb();
          });
        });
      });
    };

    $scope.$on("$ionicView.beforeEnter", function(event, data) {
      setScope();
    });

  });
