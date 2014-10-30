'use strict';

angular.module('copayApp.services').factory('Compatibility', function($rootScope) {
  var root = {};

  root.check = function (scope) {
    copay.Compatibility.listWalletsPre8(function(wallets) {
      scope.anyWallet = wallets.length > 0 ? true : false;
      scope.oldWallets = wallets;
    });
  };
  return root;
});
