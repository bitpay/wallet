var bwcModule = angular.module('bwcModule', []);
var Client = require('../node_modules/bitcore-wallet-client');

bwcModule.constant('MODULE_VERSION', '1.0.0');

bwcModule.provider("bwcService", function() {
  var provider = {};

  var config = {
    baseUrl: 'https://bws.bitpay.com/bws/api',
    verbose: null,
    transports: null
  };

  provider.setBaseUrl = function(url) {
    config.baseUrl = url;
  };

  provider.setVerbose = function(v) {
    config.verbose = v ? true : false;
  };

  provider.$get = function() {
    var service = {};

    service.setBaseUrl = function(url) {
      config.baseUrl = url;
    };

    service.setTransports = function(transports) {
      config.transports = transports;
    };

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
    service.config = config;

    service.getUtils = function() {
      return Client.Utils;
    };

    service.getClient = function(walletData) {
      var bwc = new Client({
        baseUrl: config.baseUrl,
        verbose: config.verbose,
        transports: config.transports
      });
      if (walletData)
        bwc.import(walletData);
      return bwc;
    };
    return service;
  };

  return provider;
});
