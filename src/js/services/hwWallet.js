'use strict';

angular.module('copayApp.services')
  .factory('hwWallet', function($log, bwcService) {
    var root = {};

    // Ledger magic number to get xPub without user confirmation
    root.ENTROPY_INDEX_PATH = "0xb11e/";
    root.M = 'm/';
    root.UNISIG_ROOTPATH = 44;
    root.MULTISIG_ROOTPATH = 48;
    root.LIVENET_PATH = 0;
    root.TESTNET_PATH = 1;

    root._err = function(data) {
      var msg = data.error || data.message || 'unknown';
      return msg;
    };


    root.getRootPath = function(device, isMultisig, account) {
      var path;
      if (isMultisig) {
        path = root.MULTISIG_ROOTPATH;
      } else {
        if (device == 'ledger' && account > 0) {
          path = root.MULTISIG_ROOTPATH;
        } else {
          path = root.UNISIG_ROOTPATH;
        }
      }
      if (device == 'intelTEE') {
        path = root.M + path;
      }
      return path;
    };

    root.getAddressPath = function(device, isMultisig, account, network) {
      network = network || 'livenet';
      var networkPath = root.LIVENET_PATH;
      if (network == 'testnet') {
        networkPath = root.TESTNET_PATH;
      }
      return root.getRootPath(device, isMultisig, account) + "'/" + networkPath + "'/" + account + "'";
     };

    root.getEntropyPath = function(device, isMultisig, account) {
      var path = root.ENTROPY_INDEX_PATH;
      if (isMultisig) {
        path = path + "48'/"
      } else {
        path = path + "44'/"
      }

      // Old ledger wallet compat
      if (device == 'ledger' && account == 0) {
        return path + "0'/";
      }

      if (device == 'intelTEE') {
        path = root.M + path;
      }

      return path + account + "'";
    };

    root.pubKeyToEntropySource = function(xPubKey) {
      var b = bwcService.getBitcore();
      var x = b.HDPublicKey(xPubKey);
      return x.publicKey.toString();
    };

    return root;
  });
