'use strict';

angular.module('copayApp.services')
  .factory('intelTEE', function($log, $timeout, gettext, lodash, bitcore, hwWallet, bwcService, platformInfo) {

    var root = {};

    root.description = {
      supported: platformInfo.supportsIntelTEE,
      version: platformInfo.versionIntelTEE,
      id: 'intelTEE',
      name: 'Intel TEE',
      longName: 'Intel TEE Hardware Wallet',
      derivationStrategy: 'BIP44',
      isEmbeddedHardware: true,
      supportsTestnet: true
    };

    if (!root.description.supported) {
      return root;
    }

    var IntelWallet = require('intelWalletCon');
    var TEE_APP_ID = '63279de1b6cb4dcf8c206716bd318092f8c206716bd31809263279de1b6cb4dc';

    root.walletEnclave = new IntelWallet.Wallet();
    var walletEnclaveStatus = root.walletEnclave.initializeEnclave();
    if (walletEnclaveStatus != 0) {
      $log.error('Failed to create Intel Wallet enclave');
    }

    root.getInfoForNewWallet = function(isMultisig, account, networkName, callback) {
      var opts = {};
      initSource(opts, function(err, opts) {
        if (err) return callback(err);

        root.getEntropySource(opts.hwInfo.id, isMultisig, account, function(err, entropySource) {
          if (err) return callback(err);

          opts.entropySource = entropySource;
          root.getXPubKey(opts.hwInfo.id, hwWallet.getAddressPath(root.description.id, isMultisig, account, networkName), function(data) {
            if (!data.success) {
              $log.warn(data.message);
              return callback(data);
            }
            opts.extendedPublicKey = data.xpubkey;
            opts.externalSource = root.description.id;
            opts.derivationStrategy = root.description.derivationStrategy;

            return callback(null, opts);
          });
        });
      });
    };

    root.getXPubKey = function(teeWalletId, path, callback) {
      $log.debug('TEE deriving xPub path:', path);

      // Expected to be a extended public key.
      var xpubkey = root.walletEnclave.getPublicKey(teeWalletId, path);

      // Error messages returned in value.
      var result = {
        success: false,
        message: xpubkey.ExtendedPublicKey
      };

      // Success indicated by status being equal to the tee wallet id.
      if (xpubkey.Status == teeWalletId) {
        result.success = true;
        result.message = 'OK';
        result.xpubkey = xpubkey.ExtendedPublicKey;
      } else {
        $log.error('Failed to get xpubkey from TEE wallet: ' + result.message);
      }

      callback(result);
    };

    root.getEntropySource = function(teeWalletId, isMultisig, account, callback) {
      root.getXPubKey(teeWalletId, hwWallet.getEntropyPath(root.description.id, isMultisig, account), function(data) {
        if (!data.success)
          return callback(hwWallet._err(data));

        return callback(null,  hwWallet.pubKeyToEntropySource(data.xpubkey));
      });
    };

    root.showMneumonic = function(teeWalletId, cb) {
      var result = root.walletEnclave.displayWordList(teeWalletId, 'en');
      if (result != teeWalletId) {
        cb(result);
      } else {
        cb();
      }
    };

    root.showReceiveAddress = function(teeWalletId, address, cb) {
      var isMultisig = false; // TODO
      var account = 0; // TODO
      var basePath = hwWallet.getAddressPath(root.description.id, isMultisig, account, address.network);
      var keyPath = address.path.replace('m', basePath);

      var result = root.walletEnclave.displayReceiveAddress(teeWalletId, keyPath);
      if (result != teeWalletId) {
        cb(result);
      } else {
        cb();
      }
    };

    root.signTx = function(teeWalletId, txp, callback) {
      var account = 0; // TODO
      var isMultisig = txp.requiredSignatures > 1;
      var basePath = hwWallet.getAddressPath(root.description.id, isMultisig, account, txp.network);

      var rawTx = bwcService.Client.getRawTx(txp);
      var keypaths = lodash.map(lodash.pluck(txp.inputs, 'path'), function(path) {
        return path.replace('m', basePath);
      });
      var publicKeys = lodash.pluck(txp.inputs, 'publicKeys');
      var changePublicKeys = txp.changeAddress.publicKeys;
      publicKeys.push(changePublicKeys);
      
      var changeaddrpath;
      if (txp.changeAddress) {
        changeaddrpath = txp.changeAddress.path.replace('m', basePath);
      }

      var result;
      if (txp.requiredSignatures == 1) {
        result = root.walletEnclave.signTransaction(teeWalletId, rawTx, changeaddrpath, keypaths);
      } else {
        result = root.walletEnclave.signTransaction(teeWalletId, rawTx, changeaddrpath, keypaths, publicKeys, txp.requiredSignatures, changePublicKeys, txp.requiredSignatures);
      }

      if (result.Status != teeWalletId) {
        return callback('TEE failed to sign transction: ' + result.Status);
      }
      return callback(null, result);
    };

    function initSource(opts, callback) {
        var args = {
          "Testnet" : (opts.networkName == 'livenet'? false : true),
          "PINUnlockRequired" : false,
          "PINSignatureDataRequired" : false,
          "PINSignatureTransaction" : 0,
          "ExportCount" : 10,
          "MaxPINAttempts" : 3,
          "PINTimeout" : 30
        };

        var teeStatus = root.walletEnclave.createWallet(TEE_APP_ID, args);
        switch (teeStatus) {
          case "CREATE WALLET FAILURE":
          case "CREATE WALLET FAILED TO INITIALIZE":
          case "CREATE WALLET FAILURE BAD INPUT":
          case "CREATE WALLET FAILURE case SERIALIZATION":
          case "DELETE_WALLET_AUTHORIZATION_UNSUCCESSFUL":
          case "LOAD_WALLET_FAILTURE":
          case "IMPORT WORD LIST FAILTURE":
          case "IMPORT WORD LIST FAILURE BAD INPUT":
          case "IMPORT WORD NOT IN DICTIONARY":
          case "INVALID PIN":
          case "INVALID APPLICATION ID":
          case "DISPLAY WORD LIST FAILURE":
          case "DELETE WALLET NO SUCH APPLICATION ID":
          case "SIGN DATA FAILURE":
          case "SIGN DATA INVALID HASH":
          case "SIGN DATA BUFFER TOO SMALL":
          case "SIGN DATA INVALID PIN":
          case "RECEIVE ADDRESS INVALID INPUT":
          case "RECEIVE ADDRESS NULL":
          case "RECEIVE ADDRESS BUFFER TOO SMALL":
          case "PUBLIC KEY BUFFER TOO SMALL":
          case "LOAD WALLET FAILURE":
          case "PUBLIC KEY FAILURE":
          case "PUBLIC KEY FAIL TO SERIALIZE":
          case "UKNOWN ERROR CODE":
            $log.error(teeStatus);
            return callback(teeStatus); // TODO: translate error text for display
            break;
          default:
            opts.hwInfo = {
              name: root.description.id,
              id: teeStatus
            };
            $log.debug('TEE wallet created: ' + opts.hwInfo.id);
            return callback(null, opts);
        }
    };

    return root;
});