'use strict';
angular.module('copayApp.services').factory('walletFactory', function(pluginManager){ 
  return new copay.WalletFactory(config, copay.version, pluginManager);
});

