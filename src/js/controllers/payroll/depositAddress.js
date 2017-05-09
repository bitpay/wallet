'use strict';

angular.module('copayApp.controllers').controller('payrollDepositAddressController', function($scope, $log, $timeout, $state, $ionicScrollDelegate, $ionicHistory, lodash, profileService, walletService, bitcore, gettextCatalog, configService, bitpayPayrollService, addressbookService) {

  var config = configService.getSync().wallet.settings;

  var CONTACTS_SHOW_LIMIT;
  var currentContactsPage;
  var list;

  var amountViewRecipientLabel = gettextCatalog.getString('Deposit to');
  var amountViewTitle = '';
  var amountViewAmountLabel = '';

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    if (data.stateParams && data.stateParams.id) {
      bitpayPayrollService.getPayrollRecordById(data.stateParams.id, function(err, record) {
        if (err) {
          return showError(err);
        }

        if (!record) {
          return showError(
            'No payroll record found when loading payrollDepositAddressController',
            gettextCatalog.getString('Error'),
            gettextCatalog.getString('No payroll settings specified.'));
        }

        $scope.payrollRecord = record;

        // Show the maximum amount allowed.
        amountViewAmountLabel = gettextCatalog.getString('Deposit Maximum {{amountMax}} {{currencyCode}}', {
          amountMax: $scope.payrollRecord.employee.amountMax,
          currencyCode: $scope.payrollRecord.employer.fundingCurrency
        });
      });
    } else {
      return showError(
        'No payroll record id specified when loading payrollSummaryController',
        gettextCatalog.getString('Error'),
        gettextCatalog.getString('No payroll settings specified.'));
    }

    CONTACTS_SHOW_LIMIT = 10;
    currentContactsPage = 0;
    updateList();

    $scope.entry = {
      value: null
    };

    // User may have changed alternative currency so init on each view entry.
    amountViewTitle = gettextCatalog.getString('Enter {{alternativeIsoCode}} Deposit Amount', {
      alternativeIsoCode: config.alternativeIsoCode
    });
  });

  var updateList = function() {
    list = [];
    getWallets(function(wallets) {
      if (wallets) {
        list = list.concat(wallets);
      }

      getContacts(function(contacts) {
        if (contacts) {
          list = list.concat(contacts);
        }

        $scope.list = list;
        $timeout(function() {
          $ionicScrollDelegate.resize();
          $scope.$apply();
        }, 10);
      });
    });
  };

  var getWallets = function(cb) {
    var wallets = profileService.getWallets({
      onlyComplete: true,
      network: 'livenet'
    });

    $scope.hasWallets = lodash.isEmpty(wallets) ? false : true;

    var walletList = [];
    lodash.each(wallets, function(w) {
      walletList.push({
        color: w.color,
        name: w.name,
        recipientType: 'wallet',
        getAddress: function(cb) {
          walletService.getAddress(w, false, cb);
        },
      });
    });
    cb(lodash.clone(walletList));
  };

  var getContacts = function(cb) {
    addressbookService.list(function(err, ab) {
      if (err) $log.error(err);

      $scope.hasContacts = lodash.isEmpty(ab) ? false : true;
      var allContacts = [];
      lodash.each(ab, function(v, k) {
        allContacts.push({
          name: lodash.isObject(v) ? v.name : v,
          address: k,
          email: lodash.isObject(v) ? v.email : null,
          recipientType: 'contact',
          getAddress: function(cb) {
            return cb(null, k);
          },
        });
      });
      var contactList = allContacts.slice(0, (currentContactsPage + 1) * CONTACTS_SHOW_LIMIT);
      $scope.contactsShowMore = allContacts.length > contactList.length;
      cb(lodash.clone(contactList));
    });
  };

  $scope.showMore = function() {
    currentContactsPage++;
    updateList();
  };

  $scope.processInput = function(value) {
    if (bitcore.Address.isValid(value, 'livenet')) {
      return onAddressEntry(value);
    }

    if (!value || value.length < 2) {
      $scope.list = list;
      $timeout(function() {
        $scope.$apply();
      });
      return;
    }

    var filteredList = lodash.filter(list, function(item) {
      return lodash.includes(item.name.toLowerCase(), value.toLowerCase());
    });
    $scope.list = filteredList;
  };

  $scope.onAddressScan = function(data) {
    // Remove the bitcoin protocol if present.
    onAddressEntry(data.replace(/^.*:/, ''));
  };

  function onAddressEntry(address) {
    $state.transitionTo('tabs.payroll.depositAmount', {
      recipientType: 'address',
      id: $scope.payrollRecord.id,
      toAddress: address,
      toName: null,
      toColor: null,
      viewTitle: amountViewTitle,
      recipientLabel: amountViewRecipientLabel,
      amountLabel: amountViewAmountLabel,
      amountMax: $scope.payrollRecord.employee.amountMax
    });
  };

  $scope.onItemSelect = function(item) {
    item.getAddress(function(err, address) {
      if (err || !address) {
        $log.error(err);
        return;
      }
      $log.debug('Got payroll deposit address:' + address + ' | ' + item.name);
      $state.transitionTo('tabs.payroll.depositAmount', {
        recipientType: item.recipientType,
        id: $scope.payrollRecord.id,
        toAddress: address,
        toName: item.name,
        toColor: item.color,
        viewTitle: amountViewTitle,
        recipientLabel: amountViewRecipientLabel,
        amountLabel: amountViewAmountLabel,
        amountMax: $scope.payrollRecord.employee.amountMax
      });
    });
  };

  $scope.openScanner = function() {
    $state.go('tabs.scan');
  };

  function showError(err, title, message) {
    var title = title || gettextCatalog.getString('Error');
    var message = message || gettextCatalog.getString('Could not save payroll settings.');
    $log.error(err);
    return popupService.showAlert(title, message);
  };

});
