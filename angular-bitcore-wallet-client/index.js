var bwcModule = angular.module('bwcModule', []);
var Client = require('../node_modules/bitcore-wallet-client');

bwcModule.constant('MODULE_VERSION', '1.0.0');

bwcModule.provider("bwcService", function() {
  var provider = {};

  provider.$get = function() {
    var service = {};

    service.getBitcore = function() {
      return Client.Bitcore;
    };

    service.getErrors = function() {
      return Client.errors;
    };

    service.getSJCL = function() {
      return Client.sjcl;
    };

    service.buildTx = Client.buildTx;
    service.parseSecret = Client.parseSecret;
    service.Client = Client;

    service.getUtils = function() {
      return Client.Utils;
    };

    service.getClientClass = function() {
      return Client;
    };

    service.getClient = function(walletData, opts) {
      opts = opts || {};

      //note opts use `bwsurl` all lowercase;
      var bwc = new Client({
        baseUrl: opts.bwsurl || 'https://bws.bitpay.com/bws/api',
        verbose: opts.verbose,
        transports: ['polling'],
      });
      if (walletData)
        bwc.import(walletData, opts);
      return bwc;
    };
    return service;
  };

  return provider;
});
