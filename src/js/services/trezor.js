'use strict';

angular.module('copayApp.services')
  .factory('trezor', function($log, $timeout, bwcService, gettext, lodash) {
    var root = {};

    root.ENTROPY_INDEX_PATH = "0xb11e/";
    root.callbacks = {};

    root.getEntropySource = function(account, callback) {
      var path = root.ENTROPY_INDEX_PATH + account + "'";
      var xpub = root.getXPubKey(path, function(data) {
        if (!data.success) {
          $log.warn(data.message);
          return callback(data);
        }

        var b = bwcService.getBitcore();

        var x = b.HDPublicKey(data.xpubkey);
        data.entropySource = x.publicKey.toString();
        return callback(data);
      });
    };

    root.getXPubKeyForAddresses = function(account, callback) {
      return root.getXPubKey(root._getPath(account), callback);
    };

    root.getXPubKey = function(path, callback) {
      $log.debug('TREZOR deriving xPub path:', path);
      TrezorConnect.getXPubKey(path, callback);
    };


    root.getInfoForNewWallet = function(account, callback) {
      var opts = {};
      root.getEntropySource(account, function(data) {
        if (!data.success) {
          $log.warn(data.message);
          return callback(data.message);
        }
        opts.entropySource = data.entropySource;
        $log.debug('Waiting TREZOR to settle...');
        $timeout(function() {
          root.getXPubKeyForAddresses(account, function(data) {
            if (!data.success) {
              $log.warn(data.message);
              return callback(data);
            }
            opts.extendedPublicKey = data.xpubkey;
            opts.externalSource = 'trezor';
            opts.externalIndex = account;
            console.log('[trezor.js.51:opts:]', opts); //TODO
            return callback(null, opts);
          });
        }, 5000);
      });
    };


    root.signTx = function(txp, account, callback) {
      if (txp.type != 'simple')
        return callback('Only simple TXs are supported in TREZOR');

      console.log('[trezor.js.90:txp:]', txp); //TODO
      if (txp.addressType == 'P2PKH') {
        var tx = bwcService.getUtils().buildTx(txp);

        // spend one change output
        var inputs = lodash.map(txp.inputs, function(i){
          var pathArr = i.path.split('/');
console.log('[trezor.js.72:pathArr:]',pathArr); //TODO
          var n = [44 | 0x80000000, 0 | 0x80000000, account | 0x80000000, parseInt(pathArr[1]) , parseInt(pathArr[2])];
          return {
            address_n: n,
            prev_index: i.vout,
            prev_hash: i.txid,
          };
        });
console.log('[trezor.js.68:inputs:]',inputs); //TODO

        var pathArr = txp.changeAddress.path.split('/');
console.log('[trezor.js.82:pathArr:]',pathArr); //TODO
        var n = [44 | 0x80000000, 0 | 0x80000000, account | 0x80000000, parseInt(pathArr[1]) , parseInt(pathArr[2])];
        // send to 1 address output and one change output
        var outputs = [{
          address_n: n,
          amount: txp.amount - txp.fee,
          script_type: 'PAYTOADDRESS'
        }, {
          address: txp.toAddress, 
          amount: txp.amount,
          script_type: 'PAYTOADDRESS'
        }];
console.log('[trezor.js.84:outputs:]',outputs); //TODO

        TrezorConnect.signTx(inputs, outputs, function(result) {
          console.log('[trezor.js.78:result:]', result); //TODO
          callback(result);
        });
      } else {
        var msg = 'P2SH wallets are not supported with TREZOR';
        $log.error(msg);
        return callback(msg);
      }
    }

    root._getPath = function(account) {
      return "44'/0'/" + account + "'";
    }

    return root;
  });
