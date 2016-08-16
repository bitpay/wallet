var bcpwcModule = angular.module('bcpwcModule', []);
var Client = require('../node_modules/bitcore-counterparty-wallet-client');

bcpwcModule.constant('MODULE_VERSION', '1.0.0');

bcpwcModule.provider("bcpwcService", function() {
  var provider = {};

  provider.$get = function() {
    var service = {};

    service.Client = Client;

    service.getErrors = function() {
      return Client.errors;
    };

    service.getUtils = function() {
      return Client.Utils;
    };

    service.getClient = function(walletData, opts) {
      opts = opts || {};

      //note opts use `bcpwsurl` all lowercase;
      var cpwClient = new Client({
        baseUrl: opts.bcpwsurl || 'http://52.207.122.247:3001/counterparty/api',
        verbose: opts.verbose || true
      });

      return cpwClient;
    };
    return service;
  };

  return provider;
});
