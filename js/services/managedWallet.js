'use strict';

angular.module('copayApp.services')
  .factory('managedWallet', function($rootScope) {

    var manageWallet = copay.manageWallet;

    var managedWalletService = {
      wallet: $rootScope.wallet,
      manager: manageWallet($rootScope.wallt)
    };

    // Monkey patching focus wallet to steal a reference to the wallet
    var rootScopeFocusWallet = $rootScope.setFocusedWallet;
    $rootScope.setFocusedWallet = function(wallet) {
      managedWalletService.wallet = wallet;
      managedWalletService.manager = manageWallet(wallet);
      rootScopeFocusWallet.call($rootScope, wallet);
    };

    return managedWalletService;
  })
;
