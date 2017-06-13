'use strict';

angular.module('copayApp.services')
  .factory('trezor', function($log, $timeout, lodash, bitcore, hwWallet, platformInfo) {
    var root = {};

    var SETTLE_TIME = 3000;
    root.callbacks = {};

    root.description = {
      supported: platformInfo.supportsTrezor,
      id: 'trezor',
      name: 'Trezor',
      longName: 'Trezor Hardware Wallet',
      derivationStrategy: 'BIP48',
      isEmbeddedHardware: false,
      supportsTestnet: false
    };

    root.getEntropySource = function(isMultisig, account, callback) {
      root.getXPubKey(hwWallet.getEntropyPath(root.description.id, isMultisig, account), function(data) {
        if (!data.success)
          return callback(hwWallet._err(data));

        return callback(null, hwWallet.pubKeyToEntropySource(data.xpubkey));
      });
    };


    root.getXPubKey = function(path, callback) {
      $log.debug('TREZOR deriving xPub path:', path);
      try {
        TrezorConnect.getXPubKey(path, callback);
      } catch (e) {
        callback('Error connecting Trezor');
      }
    };

    root.initSource = function(opts, callback) {
      // No initialization for this hardware source.
      return callback(opts);
    };

    root.getInfoForNewWallet = function(isMultisig, account, networkName, callback) {
      // networkName not used for this hardware (always livenet)
      var opts = {};
      root.getEntropySource(isMultisig, account, function(err, data) {
        if (err) return callback(err);
        opts.entropySource = data;
        $log.debug('Waiting TREZOR to settle...');
        $timeout(function() {

          root.getXPubKey(hwWallet.getAddressPath(root.description.id, isMultisig, account), function(data) {
            if (!data.success)
              return callback(hwWallet._err(data));

            opts.extendedPublicKey = data.xpubkey;
            opts.externalSource = root.description.id;

            if (isMultisig)
              opts.derivationStrategy = 'BIP48';

            return callback(null, opts);
          });
        }, SETTLE_TIME);
      });
    };

    root._orderPubKeys = function(xPub, np) {
      var xPubKeys = lodash.clone(xPub);
      var path = lodash.clone(np);
      path.unshift('m');
      path = path.join('/');

      var keys = lodash.map(xPubKeys, function(x) {
        var pub = (new bitcore.HDPublicKey(x)).derive(path).publicKey;
        return {
          xpub: x,
          pub: pub.toString('hex'),
        };
      });

      var sorted = lodash.sortBy(keys, function(x) {
        return x.pub;
      });

      return lodash.pluck(sorted, 'xpub');
    };

    root.signTx = function(xPubKeys, txp, account, callback) {

      var inputs = [],
        outputs = [];
      var tmpOutputs = [];

      if (txp.type && txp.type != 'simple') {
        return callback('Only TXPs type SIMPLE are supported in TREZOR');
      } else if (txp.outputs) {
        if (txp.outputs.length > 1)
          return callback('Only single output TXPs are supported in TREZOR');
      } else {
        return callback('Unknown TXP at TREZOR');
      }

      if (txp.outputs) {

        if (!txp.toAddress)
          txp.toAddress = txp.outputs[0].toAddress;

        if (!txp.amount)
          txp.amount = txp.outputs[0].amount;
      }

      if (!txp.toAddress || !txp.amount)
        return callback('No address or amount at TREZOR signing');


      var toScriptType = 'PAYTOADDRESS';
      if (txp.toAddress.charAt(0) == '2' || txp.toAddress.charAt(0) == '3')
        toScriptType = 'PAYTOSCRIPTHASH';


      // Add to
      tmpOutputs.push({
        address: txp.toAddress,
        amount: txp.amount,
        script_type: toScriptType,
      });



      if (txp.addressType == 'P2PKH') {

        $log.debug("Trezor signing uni-sig p2pkh. Account:", account);

        var inAmount = 0;
        inputs = lodash.map(txp.inputs, function(i) {
          $log.debug("Trezor TX input path:", i.path);
          var pathArr = i.path.split('/');
          var n = [hwWallet.UNISIG_ROOTPATH | 0x80000000, 0 | 0x80000000, account | 0x80000000, parseInt(pathArr[1]), parseInt(pathArr[2])];
          inAmount += i.satoshis;
          return {
            address_n: n,
            prev_index: i.vout,
            prev_hash: i.txid,
          };
        });

        var change = inAmount - txp.fee - txp.amount;
        if (change > 0) {
          $log.debug("Trezor TX change path:", txp.changeAddress.path);
          var pathArr = txp.changeAddress.path.split('/');
          var n = [hwWallet.UNISIG_ROOTPATH | 0x80000000, 0 | 0x80000000, account | 0x80000000, parseInt(pathArr[1]), parseInt(pathArr[2])];

          tmpOutputs.push({
            address_n: n,
            amount: change,
            script_type: 'PAYTOADDRESS'
          });
        }

      } else {

        // P2SH Wallet, multisig wallet
        var inAmount = 0;
        $log.debug("Trezor signing multi-sig p2sh. Account:", account);

        var sigs = xPubKeys.map(function(v) {
          return '';
        });

        inputs = lodash.map(txp.inputs, function(i) {
          $log.debug("Trezor TX input path:", i.path);
          var pathArr = i.path.split('/');
          var n = [hwWallet.MULTISIG_ROOTPATH | 0x80000000, 0 | 0x80000000, account | 0x80000000, parseInt(pathArr[1]), parseInt(pathArr[2])];
          var np = n.slice(3);

          inAmount += i.satoshis;

          var orderedPubKeys = root._orderPubKeys(xPubKeys, np);
          var pubkeys = orderedPubKeys.map(function(v) {
            return {
              node: v,
              address_n: np,
            };
          });

          return {
            address_n: n,
            prev_index: i.vout,
            prev_hash: i.txid,
            script_type: 'SPENDMULTISIG',
            multisig: {
              pubkeys: pubkeys,
              signatures: sigs,
              m: txp.requiredSignatures,
            }
          };
        });

        var change = inAmount - txp.fee - txp.amount;
        if (change > 0) {
          $log.debug("Trezor TX change path:", txp.changeAddress.path);
          var pathArr = txp.changeAddress.path.split('/');
          var n = [hwWallet.MULTISIG_ROOTPATH | 0x80000000, 0 | 0x80000000, account | 0x80000000, parseInt(pathArr[1]), parseInt(pathArr[2])];
          var np = n.slice(3);

          var orderedPubKeys = root._orderPubKeys(xPubKeys, np);
          var pubkeys = orderedPubKeys.map(function(v) {
            return {
              node: v,
              address_n: np,
            };
          });

          tmpOutputs.push({
            address_n: n,
            amount: change,
            script_type: 'PAYTOMULTISIG',
            multisig: {
              pubkeys: pubkeys,
              signatures: sigs,
              m: txp.requiredSignatures,
            }
          });
        }
      }

      // Shuffle outputs for improved privacy
      if (tmpOutputs.length > 1) {
        outputs = new Array(tmpOutputs.length);
        lodash.each(txp.outputOrder, function(order) {
          outputs[order] = tmpOutputs.shift();
        });

        if (tmpOutputs.length)
          return cb("Error creating transaction: tmpOutput order");
      } else {
        outputs = tmpOutputs;
      }

      // Prevents: Uncaught DataCloneError: Failed to execute 'postMessage' on 'Window': An object could not be cloned.
      inputs = JSON.parse(JSON.stringify(inputs));
      outputs = JSON.parse(JSON.stringify(outputs));

      $log.debug('Signing with TREZOR', inputs, outputs);
      TrezorConnect.signTx(inputs, outputs, function(res) {
        if (!res.success)
          return callback(hwWallet._err(res));

        callback(null, res);
      });
    };

    return root;
  });
