'use strict';

angular.module('copayApp.services').factory('walletService', function($log, lodash, trezor, ledger, storageService) {
  var root = {};

  var _signWithLedger = function(client, txp, cb) {
    $log.info('Requesting Ledger Chrome app to sign the transaction');

    ledger.signTx(txp, client.credentials.account, function(result) {
      $log.debug('Ledger response', result);
      if (!result.success)
        return cb(result.message || result.error);

      txp.signatures = lodash.map(result.signatures, function(s) {
        return s.substring(0, s.length - 2);
      });
      return client.signTxProposal(txp, cb);
    });
  };

  var _signWithTrezor = function(client, txp, cb) {
    $log.info('Requesting Trezor  to sign the transaction');

    var xPubKeys = lodash.pluck(client.credentials.publicKeyRing, 'xPubKey');
    trezor.signTx(xPubKeys, txp, client.credentials.account, function(err, result) {
      if (err) return cb(err);

      $log.debug('Trezor response', result);
      txp.signatures = result.signatures;
      return client.signTxProposal(txp, cb);
    });
  };

  root.isBackupNeeded = function(client, cb) {
    if (client.isPrivKeyExternal()) return cb(false);
    if (!client.credentials.mnemonic) return cb(false);
    if (client.credentials.network == 'testnet') return cb(false);

    storageService.getBackupFlag(client.credentials.walletId, function(err, val) {
      if (err) $log.error(err);
      if (val) return cb(false);
      return cb(true);
    });
  };

  root.isReady = function(client, cb) {
    if(!client.isComplete()) 
      return cb('WALLET_NOT_COMPLETE');
    root.isBackupNeeded(client, function(needsBackup) {
      if (needsBackup)
        return cb('WALLET_NEEDS_BACKUP');
      return cb();
    });
  };

  root.isEncrypted = function(client) {
    if (lodash.isEmpty(client)) return;
    var isEncrypted = client.isPrivKeyEncrypted();
    if (isEncrypted) $log.debug('Wallet is encrypted');
    return isEncrypted;
  };

  root.lock = function(client) {
    try {
      client.lock();
    } catch (e) {
      $log.warn('Encrypting wallet:', e);
    };
  };

  root.unlock = function(client, password) {
    if (lodash.isEmpty(client))
      return 'MISSING_PARAMETER';
    if (lodash.isEmpty(password))
      return 'NO_PASSWORD_GIVEN';
    try {
      client.unlock(password);
    } catch (e) {
      $log.warn('Decrypting wallet:', e);
      return 'PASSWORD_INCORRECT';
    }
  };

  root.createTx = function(client, txp, cb) {
    if (lodash.isEmpty(txp) || lodash.isEmpty(client)) 
      return cb('MISSING_PARAMETER');

    if (txp.sendMax) {
      client.createTxProposal(txp, function(err, createdTxp) {
        if (err) return cb(err);
        else return cb(null, createdTxp);
      });
    } else {
      client.getFeeLevels(client.credentials.network, function(err, levels) {
        if (err) return cb(err);

        var feeLevelValue = lodash.find(levels, {
          level: txp.feeLevel
        });
      
        if (!feeLevelValue || !feeLevelValue.feePerKB)
          return cb({
            message: 'Could not get dynamic fee for level: ' + feeLevel
          });

        $log.debug('Dynamic fee: ' + txp.feeLevel + ' ' + feeLevelValue.feePerKB + ' SAT');

        txp.feePerKb = feeLevelValue.feePerKB;
        client.createTxProposal(txp, function(err, createdTxp) {
          if (err) return cb(err);
          else {
            $log.debug('Transaction created');
            return cb(null, createdTxp);
          }
        });
      });
    }
  };

  root.publishTx = function(client, txp, cb) {
    if (lodash.isEmpty(txp) || lodash.isEmpty(client)) 
      return cb('MISSING_PARAMETER');

    client.publishTxProposal({txp: txp}, function(err, publishedTx) {
      if (err) return cb(err);
      else {
        $log.debug('Transaction published');
        return cb(null, publishedTx);
      }
    });
  };

  root.signTx = function(client, txp, cb) {
    if (lodash.isEmpty(txp) || lodash.isEmpty(client)) 
      return cb('MISSING_PARAMETER');
    
    if (client.isPrivKeyExternal()) {
      switch (client.getPrivKeyExternalSourceName()) {
        case 'ledger':
          return _signWithLedger(client, txp, cb);
        case 'trezor':
          return _signWithTrezor(client, txp, cb);
        default:
          var msg = 'Unsupported External Key:' + client.getPrivKeyExternalSourceName();
          $log.error(msg);
          return cb(msg);
      }
    } else {

      try {
        client.signTxProposal(txp, function(err, signedTxp) {
          $log.debug('Transaction signed');
          return cb(err, signedTxp);
        });
      } catch (e) {
        $log.warn('Error at signTxProposal:', e);
        return cb(e);
      }
    }
  };

  root.broadcastTx = function(client, txp, cb) {
    if (lodash.isEmpty(txp) || lodash.isEmpty(client)) 
      return cb('MISSING_PARAMETER');
      
    if (txp.status != 'accepted')
      return cb('TX_NOT_ACCEPTED');

    client.broadcastTxProposal(txp, function(err, broadcastedTxp, memo) {
      if (err) 
        return cb(err);

      $log.debug('Transaction broadcasted');
      if (memo) $log.info(memo);

      return cb(null, broadcastedTxp);
    });
  };

  root.rejectTx = function(client, txp, cb) {
    if (lodash.isEmpty(txp) || lodash.isEmpty(client)) 
      return cb('MISSING_PARAMETER');
    
    client.rejectTxProposal(txp, null, function(err, rejectedTxp) {
      $log.debug('Transaction rejected');
      return cb(err, rejectedTxp);
    });
  };

  root.removeTx = function(client, txp, cb) {
    if (lodash.isEmpty(txp) || lodash.isEmpty(client)) 
      return cb('MISSING_PARAMETER');
    
    client.removeTxProposal(txp, function(err) {
      $log.debug('Transaction removed');
      return cb(err);
    });
  };

  return root;
});
