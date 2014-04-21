'use strict';

var wf;
angular.module('copay.walletFactory').factory('walletFactory', function($rootScope) {
  wf = wf || new copay.WalletFactory(config);
  return wf;
});

