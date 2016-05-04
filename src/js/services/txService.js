'use strict';

angular.module('copayApp.services').factory('txService', function($rootScope, profileService, gettextCatalog, lodash, trezor, ledger, configService, bwsError, $log, feeService) {
  var root = {};

  var reportSigningStatus = function(opts) {
    opts = opts || {};
    if (!opts.reporterFn) return;

    var fc = opts.selectedClient || profileService.focusedClient;

    if (fc.isPrivKeyExternal()) {
      if (fc.getPrivKeyExternalSourceName() == 'ledger') {
        opts.reporterFn(gettextCatalog.getString('Requesting Ledger Wallet to sign'));
      } else if (fc.getPrivKeyExternalSourceName() == 'trezor') {
        opts.reporterFn(gettextCatalog.getString('Requesting Trezor Wallet to sign'));
      }
    } else {
      opts.reporterFn(gettextCatalog.getString('Signing payment'));
    }
  };

  var reportBroadcastingStatus = function(opts) {
    if (!opts.reporterFn) return;

    opts.reporterFn(gettextCatalog.getString('Broadcasting transaction'));
  };

  var stopReport = function(opts) {
    if (!opts.reporterFn) return;

    opts.reporterFn();
  };

  var requestTouchId = function(cb) {
    try {
      window.plugins.touchid.verifyFingerprint(
        gettextCatalog.getString('Scan your fingerprint please'),
        function(msg) {
          $log.debug('Touch ID OK');
          return cb();
        },
        function(msg) {
          $log.debug('Touch ID Failed:' + JSON.stringify(msg));
          return cb(gettextCatalog.getString('Touch ID Failed') + ': ' + msg.localizedDescription);
        }
      );
    } catch (e) {
      $log.debug('Touch ID Failed:' + JSON.stringify(e));
      return cb(gettextCatalog.getString('Touch ID Failed'));
    };
  };

  root.setTouchId = function(cb) {
    if (window.touchidAvailable) {
      requestTouchId(cb);
    } else {
      return cb();
    }
  };

  root.checkTouchId = function(opts, cb) {
    opts = opts || {};
    var config = configService.getSync();
    var fc = opts.selectedClient || profileService.focusedClient;
    config.touchIdFor = config.touchIdFor || {};
    if (window.touchidAvailable && config.touchIdFor[fc.credentials.walletId]) {
      requestTouchId(cb);
    } else {
      return cb();
    }
  };

  root.prepare = function(opts, cb) {
    $log.info("at .prepare");
    opts = opts || {};
    var fc = opts.selectedClient || profileService.focusedClient;
    $log.info('FC Client Dump:' + fc);
    if (!fc.canSign() && !fc.isPrivKeyExternal())
      return cb('Cannot sign'); // should never happen, no need to translate

    root.checkTouchId(opts, function(err) {
      if (err) {
        $log.warn('CheckTouchId error:', err);
        return cb(err);
      };

      profileService.unlockFC(fc, function(err) {
        if (err) {
          $log.warn("prepare/unlockFC error:", err);
          return cb(err);
        };

        return cb();

      });
    });
  };

  root.removeTx = function(txp, opts, cb) {
    opts = opts || {};
    var fc = opts.selectedClient || profileService.focusedClient;

    fc.removeTxProposal(txp, function(err) {
      return cb(err);
    });
  };

  root.createTx = function(opts, cb) {
    opts = opts || {};
    var fc = opts.selectedClient || profileService.focusedClient;
    var currentSpendUnconfirmed = configService.getSync().wallet.spendUnconfirmed;

    var getFee = function(cb) {
      if (opts.lockedCurrentFeePerKb) {
        cb(null, opts.lockedCurrentFeePerKb);
      } else {
        feeService.getCurrentFeeValue(cb);
      }
    };

    if (opts.sendMax) {
      fc.createTxProposal(opts, function(err, txp) {
        if (err) return cb(err);
        else return cb(null, txp);
      });
    }else {
      getFee(function(err, feePerKb) {
        if (err) return cb(err);

        opts.feePerKb = feePerKb;
        opts.excludeUnconfirmedUtxos = currentSpendUnconfirmed ? false : true;
        fc.createTxProposal(opts, function(err, txp) {
          if (err) return cb(err);
          else return cb(null, txp);
        });
      });
    }
  };

  root.publishTx = function(txp, opts, cb) {
    opts = opts || {};
    var fc = opts.selectedClient || profileService.focusedClient;
    fc.publishTxProposal({txp: txp}, function(err, txp) {
      if (err) return cb(err);
      else return cb(null, txp);
    });
  };

  var _signWithLedger = function(txp, opts, cb) {
    opts = opts || {};
    var fc = opts.selectedClient || profileService.focusedClient;
    $log.info('Requesting Ledger Chrome app to sign the transaction');

    ledger.signTx(txp, fc.credentials.account, function(result) {
      $log.debug('Ledger response', result);
      if (!result.success)
        return cb(result.message || result.error);

      txp.signatures = lodash.map(result.signatures, function(s) {
        return s.substring(0, s.length - 2);
      });
      return fc.signTxProposal(txp, cb);
    });
  };

  var _signWithTrezor = function(txp, opts, cb) {
    opts = opts || {};
    var fc = opts.selectedClient || profileService.focusedClient;
    $log.info('Requesting Trezor  to sign the transaction');

    var xPubKeys = lodash.pluck(fc.credentials.publicKeyRing, 'xPubKey');
    trezor.signTx(xPubKeys, txp, fc.credentials.account, function(err, result) {
      if (err) return cb(err);

      $log.debug('Trezor response', result);
      txp.signatures = result.signatures;
      return fc.signTxProposal(txp, cb);
    });
  };

  root.sign = function(txp, opts, cb) {
    $log.info('at .sign');
    opts = opts || {};
    var fc = opts.selectedClient || profileService.focusedClient;

    if (fc.isPrivKeyExternal()) {
      switch (fc.getPrivKeyExternalSourceName()) {
        case 'ledger':
          return _signWithLedger(txp, opts, cb);
        case 'trezor':
          return _signWithTrezor(txp, opts, cb);
        default:
          var msg = 'Unsupported External Key:' + fc.getPrivKeyExternalSourceName();
          $log.error(msg);
          return cb(msg);
      }
    } else {

      txp.signatures = null;
      $log.info('at .sign: (isEncrypted):', fc.isPrivKeyEncrypted());
      $log.info('txp BEFORE .signTxProposal:', txp);

      try {
        fc.signTxProposal(txp, function(err, signedTxp) {
          $log.info('txp AFTER:',err, signedTxp);
          profileService.lockFC(fc);
          return cb(err, signedTxp);
        });
      } catch (e) {
        $log.warn('Error at signTxProposal:', e);
        return cb(e);
      }
    }
  };

  root.signAndBroadcast = function(txp, opts, cb) {
    $log.info('at .signAndBroadcast');
    opts = opts || {};
    reportSigningStatus(opts);

    var fc = opts.selectedClient || profileService.focusedClient;
    root.sign(txp, opts, function(err, txp) {
      if (err) {
        stopReport(opts);
        return bwsError.cb(err, gettextCatalog.getString('Could not accept payment'), cb);
      };

      if (txp.status != 'accepted') {
        stopReport(opts);
        return cb(null, txp);
      }

      reportBroadcastingStatus(opts);
      fc.broadcastTxProposal(txp, function(err, txp, memo) {
        stopReport(opts);

        if (err) {
          return bwsError.cb(err, gettextCatalog.getString('Could not broadcast payment'), cb);
        };

        $log.debug('Transaction signed and broadcasted')

        if (memo)
          $log.info(memo);

        return cb(null, txp);
      });
    });
  };

  root.prepareAndSignAndBroadcast = function(txp, opts, cb) {
    opts = opts || {};
    $log.info('at .prepareSignAndBroadcast');

    root.prepare(opts, function(err) {
      if (err) {
        $log.warn('Prepare error:' +  err);
        stopReport(opts);
        return cb(err);
      };
      root.signAndBroadcast(txp, opts, function(err, txp) {
        if (err) {
          stopReport(opts);
          return cb(err);
        };
        return cb(null, txp);
      });
    });
  };
  return root;
});
