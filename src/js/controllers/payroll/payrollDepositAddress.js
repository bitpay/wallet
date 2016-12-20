'use strict';

angular.module('copayApp.controllers').controller('payrollDepositAddressController', function($scope, $log, $timeout, $state, $ionicScrollDelegate, lodash, profileService, walletService, bitcore, gettextCatalog, configService) {

  var walletList;

  var config = configService.getSync().wallet.settings;
  var amountViewTitle;
  var amountRecipientLabel = gettextCatalog.getString('Deposit to');
  var amountLabel = gettextCatalog.getString('Deduction');

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    walletList = [];
    var wallets = profileService.getWallets({
      onlyComplete: true,
      network: 'livenet'
    });

    lodash.each(wallets, function(v) {
      walletList.push({
        color: v.color,
        name: v.name,
        isWallet: true,
        getAddress: function(cb) {
          walletService.getAddress(v, false, cb);
        },
      });
    });

    $scope.list = lodash.clone(walletList);
    $scope.hasWallets = lodash.isEmpty(wallets) ? false : true;
    $scope.formData = {
      depositAddress: null
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
      wallet.getAddress(function(err, addr) {
        if (err || !addr) {
          $log.error(err);
          return;
        }
        $log.debug('Got payroll deposit address:' + addr + ' | ' + wallet.name);
        return $state.transitionTo('tabs.payroll.depositAmount', {
          isWallet: true,
          toAddress: addr,
          toName: wallet.name,
          toColor: wallet.color,
          viewTitle: amountViewTitle,
          recipientLabel: amountRecipientLabel,
          amountLabel: amountLabel
        });
      });
    });
  };

  $scope.openScanner = function() {
    $state.go('tabs.scan');
  };

});
