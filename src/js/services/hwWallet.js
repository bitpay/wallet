'use strict';

angular.module('copayApp.services')
  .factory('hwWallet', function($log,  bwcService) {
    var root = {};

    // Ledger magic number to get xPub without user confirmation
    root.ENTROPY_INDEX_PATH = "0xb11e/";
    root.UNISIG_ROOTPATH = 44;
    root.MULTISIG_ROOTPATH = 48;
    root.LIVENET_PATH = 0;

    root._err = function(data) {
      var msg = 'Hardware Wallet Error: ' + (data.error || data.message || 'unknown');
      $log.warn(msg);
      return JSON.parse(JSON.stringify(msg));
    };

    root.getAddressPath = function(isMultisig, account) {
      var rootPath = isMultisig ? root.MULTISIG_ROOTPATH : root.UNISIG_ROOTPATH;
      return rootPath + "'/" + root.LIVENET_PATH + "'/" + account + "'";
    }

    root.getEntropyPath = function(isMultisig, account) {
      var rootPath = isMultisig ? root.MULTISIG_ROOTPATH : root.UNISIG_ROOTPATH;
      var path = root.ENTROPY_INDEX_PATH + rootPath + "'/" + account + "'";
      return path;
    };

    root.pubKeyToEntropySource = function(xPubKey) {
      var b = bwcService.getBitcore();
      var x = b.HDPublicKey(xPubKey);
      return x.publicKey.toString();
    };

    return root;
  });
