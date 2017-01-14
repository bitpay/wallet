'use strict';

angular.module('copayApp.controllers').controller('payrollDepositAddressController', function($scope, $log, $timeout, $state, $ionicScrollDelegate, lodash, profileService, walletService, bitcore, gettextCatalog, configService, bitpayPayrollService) {

  var config = configService.getSync().wallet.settings;
  var walletList;

  var amountViewAmountLabel = gettextCatalog.getString('Deduction');
  var amountViewRecipientLabel = gettextCatalog.getString('Deposit to');
  var amountViewTitle = '';

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    if (data.stateParams && data.stateParams.id) {
      bitpayPayrollService.getPayrollRecords(function(err, records) {
        if (err) {
          return showError(err);
        }

        $scope.payrollRecord = lodash.find(records, function(r) {
          return r.id == data.stateParams.id;
        });

        if (!$scope.payrollRecord) {
          return showError(
            'No payroll record found when loading payrollDepositAddressController',
            gettextCatalog.getString('Error'),
            gettextCatalog.getString('No payroll settings specified.'));
        }
      });
    } else {
      return showError(
        'No payroll record id specified when loading payrollSummaryController',
        gettextCatalog.getString('Error'),
        gettextCatalog.getString('No payroll settings specified.'));
    }
       
    walletList = [];
    var wallets = profileService.getWallets({
      onlyComplete: true,
      network: 'livenet'
    });

    lodash.each(wallets, function(w) {
      walletList.push({
        color: w.color,
        name: w.name,
        isWallet: true,
        getAddress: function(cb) {
          walletService.getAddress(w, false, cb);
        },
      });
    });

    $scope.wallets = lodash.clone(walletList);
    $scope.hasWallets = lodash.isEmpty(wallets) ? false : true;
    $scope.address = {
      value: null
    };

    // User may have changed alternative currency so init on each view entry.
    amountViewTitle = gettextCatalog.getString('Enter {{alternativeIsoCode}} Deduction', {alternativeIsoCode: config.alternativeIsoCode});

    $timeout(function() {
      $ionicScrollDelegate.resize();
      $scope.$apply();
    }, 10);
  });

  $scope.onAddressEntry = function(address) {
    if (bitcore.Address.isValid(address, 'livenet')) {
	    return $state.transitionTo('tabs.payroll.depositAmount', {
        payrollRecordId: $scope.payrollRecord.id,
        isWallet: false,
        toAddress: address,
        toName: null,
        toColor: null,
        viewTitle: amountViewTitle,
        recipientLabel: amountRecipientLabel,
        amountLabel: amountLabel
	    });
    }
  };

  $scope.onWalletSelect = function(wallet) {
    $timeout(function() {
      wallet.getAddress(function(err, address) {
        if (err || !address) {
          $log.error(err);
          return;
        }
        $log.debug('Got payroll deposit address:' + address + ' | ' + wallet.name);
        return $state.transitionTo('tabs.payroll.depositAmount', {
          payrollRecordId: $scope.payrollRecord.id,
          isWallet: true,
          toAddress: address,
          toName: wallet.name,
          toColor: wallet.color,
          viewTitle: amountViewTitle,
          recipientLabel: amountViewRecipientLabel,
          amountLabel: amountViewAmountLabel
        });
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
