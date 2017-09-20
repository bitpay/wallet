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
    service.getConstants = function() {
      return Client.Constants;
    };    

    service.getClient = function(walletData, opts) {
      opts = opts || {};
      if(!opts.bwsurl) {
        throw new Error("BWS URL not specified")
      }

      //note opts use `bwsurl` all lowercase;
      var bwc = new Client({
        baseUrl: opts.bwsurl,
        verbose: opts.verbose,
        timeout: 100000,
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
