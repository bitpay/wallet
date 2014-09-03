'use strict';
angular.module('copayApp.services').factory('walletFactory', function(pluginManager){ 

console.log('[walletFactory.js.3]'); //TODO
  return new copay.WalletFactory(config, copay.version, pluginManager);
});

