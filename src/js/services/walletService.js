'use strict';

angular.module('copayApp.services').factory('walletService', function($log, lodash, trezor, ledger, storageService) {
  var root = {};

  var _signWithLedger = function(txp, client, cb) {
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

  var _signWithTrezor = function(txp, client, cb) {
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

  root.createTx = function(txp, client, cb) {
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

  root.publishTx = function(txp, client, cb) {
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

  root.signTx = function(txp, client, cb) {
    if (lodash.isEmpty(txp) || lodash.isEmpty(client)) 
      return cb('MISSING_PARAMETER');
    
    if (client.isPrivKeyExternal()) {
      switch (client.getPrivKeyExternalSourceName()) {
        case 'ledger':
          return _signWithLedger(txp, opts, cb);
        case 'trezor':
          return _signWithTrezor(txp, opts, cb);
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

  root.broadcastTx = function(txp, client, cb) {
    if (lodash.isEmpty(txp) || lodash.isEmpty(client)) 
      return cb('MISSING_PARAMETER');
      
    if (txp.status != 'accepted')
      return cb('TX_NOT_ACCEPTED');

    client.broadcastTxProposal(txp, function(err, txp, memo) {
      if (err) 
        return cb(err);

      $log.debug('Transaction broadcasted');
      if (memo) $log.info(memo);

      return cb(null, txp);
    });
  };

  return root;
});
