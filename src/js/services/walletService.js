'use strict';

angular.module('copayApp.services').factory('walletService', function($log, $timeout, lodash, trezor, ledger, intelTEE, storageService, configService, rateService, uxLanguage, $filter, gettextCatalog, bwcError, $ionicPopup, fingerprintService, ongoingProcess, gettext, $rootScope, txFormatService, $ionicModal, $state, bwcService, bitcore, bitcoreCash, popupService, feeService) {

  // Ratio low amount warning (fee/amount) in incoming TX
  var LOW_AMOUNT_RATIO = 0.15;

  // Ratio of "many utxos" warning in total balance (fee/amount)
  var TOTAL_LOW_WARNING_RATIO = .3;

  var root = {};

  root.externalSource = {
    ledger: ledger.description,
    trezor: trezor.description,
    intelTEE: intelTEE.description
  }

  root.WALLET_STATUS_MAX_TRIES = 7;
  root.WALLET_STATUS_DELAY_BETWEEN_TRIES = 1.4 * 1000;
  root.SOFT_CONFIRMATION_LIMIT = 12;
  root.SAFE_CONFIRMATIONS = 6;

  var errors = bwcService.getErrors();

  var _signWithLedger = function(wallet, txp, cb) {
    $log.info('Requesting Ledger Chrome app to sign the transaction');

    ledger.signTx(txp, wallet.credentials.account, function(result) {
      $log.debug('Ledger response', result);
      if (!result.success)
        return cb(result.message || result.error);

      txp.signatures = lodash.map(result.signatures, function(s) {
        return s.substring(0, s.length - 2);
      });
      return wallet.signTxProposal(txp, cb);
    });
  };

  var _signWithTrezor = function(wallet, txp, cb) {
    $log.info('Requesting Trezor  to sign the transaction');

    var xPubKeys = lodash.pluck(wallet.credentials.publicKeyRing, 'xPubKey');
    trezor.signTx(xPubKeys, txp, wallet.credentials.account, function(err, result) {
      if (err) return cb(err);

      $log.debug('Trezor response', result);
      txp.signatures = result.signatures;
      return wallet.signTxProposal(txp, cb);
    });
  };

  var _signWithIntelTEE = function(wallet, txp, cb) {
    $log.info('Requesting Intel TEE to sign the transaction');

    intelTEE.signTx(wallet.credentials.hwInfo.id, txp, function(err, result) {
      if (err) return cb(err);

      $log.debug('Intel TEE response', result);
      txp.signatures = result.Signatures;
      return wallet.signTxProposal(txp, cb);
    });
  };

  root.showMneumonicFromHardware = function(wallet, cb) {
    switch (wallet.getPrivKeyExternalSourceName()) {
      case root.externalSource.intelTEE.id:
        return intelTEE.showMneumonic(wallet.credentials.hwInfo.id, cb);
        break;
      default:
        cb('Error: unrecognized external source');
        break;
    }
  };

  root.showReceiveAddressFromHardware = function(wallet, address, cb) {
    switch (wallet.getPrivKeyExternalSourceName()) {
      case root.externalSource.intelTEE.id:
        root.getAddressObj(wallet, address, function(err, addrObj) {
          if (err) return cb(err);
          return intelTEE.showReceiveAddress(wallet.credentials.hwInfo.id, addrObj, cb);
        });
        break;
      default:
        cb('Error: unrecognized external source');
        break;
    }
  };

  root.invalidateCache = function(wallet) {
    if (wallet.cachedStatus)
      wallet.cachedStatus.isValid = false;

    if (wallet.completeHistory)
      wallet.completeHistory.isValid = false;

    if (wallet.cachedActivity)
      wallet.cachedActivity.isValid = false;

    if (wallet.cachedTxps)
      wallet.cachedTxps.isValid = false;
  };

  root.getStatus = function(wallet, opts, cb) {
    opts = opts || {};
    var walletId = wallet.id;

    function processPendingTxps(status) {
      var txps = status.pendingTxps;
      var now = Math.floor(Date.now() / 1000);

      /* To test multiple outputs...
      var txp = {
        message: 'test multi-output',
        fee: 1000,
        createdOn: new Date() / 1000,
        outputs: []
      };
      function addOutput(n) {
        txp.outputs.push({
          amount: 600,
          toAddress: '2N8bhEwbKtMvR2jqMRcTCQqzHP6zXGToXcK',
          message: 'output #' + (Number(n) + 1)
        });
      };
      lodash.times(150, addOutput);
      txps.push(txp);
      */

      lodash.each(txps, function(tx) {

        tx = txFormatService.processTx(wallet.coin, tx);

        // no future transactions...
        if (tx.createdOn > now)
          tx.createdOn = now;

        tx.wallet = wallet;

        if (!tx.wallet) {
          $log.error("no wallet at txp?");
          return;
        }

        var action = lodash.find(tx.actions, {
          copayerId: tx.wallet.copayerId
        });

        if (!action && tx.status == 'pending') {
          tx.pendingForUs = true;
        }

        if (action && action.type == 'accept') {
          tx.statusForUs = 'accepted';
        } else if (action && action.type == 'reject') {
          tx.statusForUs = 'rejected';
        } else {
          tx.statusForUs = 'pending';
        }

        if (!tx.deleteLockTime)
          tx.canBeRemoved = true;
      });

      wallet.pendingTxps = txps;
    };


    function get(cb) {
      wallet.getStatus({
        twoStep: true
      }, function(err, ret) {
        if (err) {
          if (err instanceof errors.NOT_AUTHORIZED) {
            return cb('WALLET_NOT_REGISTERED');
          }
          return cb(err);
        }

        return cb(null, ret);
      });
    };

    function cacheBalance(wallet, balance) {
      if (!balance) return;

      var config = configService.getSync().wallet;

      var cache = wallet.cachedStatus;

      // Address with Balance
      cache.balanceByAddress = balance.byAddress;

      // Total wallet balance is same regardless of 'spend unconfirmed funds' setting.
      cache.totalBalanceSat = balance.totalAmount;

      // Spend unconfirmed funds
      if (config.spendUnconfirmed) {
        cache.lockedBalanceSat = balance.lockedAmount;
        cache.availableBalanceSat = balance.availableAmount;
        cache.totalBytesToSendMax = balance.totalBytesToSendMax;
        cache.pendingAmount = 0;
        cache.spendableAmount = balance.totalAmount - balance.lockedAmount;
      } else {
        cache.lockedBalanceSat = balance.lockedConfirmedAmount;
        cache.availableBalanceSat = balance.availableConfirmedAmount;
        cache.totalBytesToSendMax = balance.totalBytesToSendConfirmedMax;
        cache.pendingAmount = balance.totalAmount - balance.totalConfirmedAmount;
        cache.spendableAmount = balance.totalConfirmedAmount - balance.lockedAmount;
      }

      // Selected unit
      cache.unitToSatoshi = config.settings.unitToSatoshi;
      cache.satToUnit = 1 / cache.unitToSatoshi;

      //STR
      cache.totalBalanceStr = txFormatService.formatAmountStr(wallet.coin, cache.totalBalanceSat);
      cache.lockedBalanceStr = txFormatService.formatAmountStr(wallet.coin, cache.lockedBalanceSat);
      cache.availableBalanceStr = txFormatService.formatAmountStr(wallet.coin, cache.availableBalanceSat);
      cache.spendableBalanceStr = txFormatService.formatAmountStr(wallet.coin, cache.spendableAmount);
      cache.pendingBalanceStr = txFormatService.formatAmountStr(wallet.coin, cache.pendingAmount);

      cache.alternativeName = config.settings.alternativeName;
      cache.alternativeIsoCode = config.settings.alternativeIsoCode;

      // Check address
      root.isAddressUsed(wallet, balance.byAddress, function(err, used) {
        if (used) {
          $log.debug('Address used. Creating new');
          // Force new address
          root.getAddress(wallet, true, function(err, addr) {
            $log.debug('New address: ', addr);
          });
        }
      });

      rateService.whenAvailable(function() {

        var totalBalanceAlternative = rateService.toFiat(cache.totalBalanceSat, cache.alternativeIsoCode, wallet.coin);
        var pendingBalanceAlternative = rateService.toFiat(cache.pendingAmount, cache.alternativeIsoCode, wallet.coin);
        var lockedBalanceAlternative = rateService.toFiat(cache.lockedBalanceSat, cache.alternativeIsoCode, wallet.coin);
        var spendableBalanceAlternative = rateService.toFiat(cache.spendableAmount, cache.alternativeIsoCode, wallet.coin);
        var alternativeConversionRate = rateService.toFiat(100000000, cache.alternativeIsoCode, wallet.coin);

        cache.totalBalanceAlternative = $filter('formatFiatAmount')(totalBalanceAlternative);
        cache.pendingBalanceAlternative = $filter('formatFiatAmount')(pendingBalanceAlternative);
        cache.lockedBalanceAlternative = $filter('formatFiatAmount')(lockedBalanceAlternative);
        cache.spendableBalanceAlternative = $filter('formatFiatAmount')(spendableBalanceAlternative);
        cache.alternativeConversionRate = $filter('formatFiatAmount')(alternativeConversionRate);

        cache.alternativeBalanceAvailable = true;
        cache.isRateAvailable = true;
      });
    };

    function isStatusCached() {
      return wallet.cachedStatus && wallet.cachedStatus.isValid;
    };

    function cacheStatus(status) {
      if (status.wallet && status.wallet.scanStatus == 'running') return;

      wallet.cachedStatus = status ||  {};
      var cache = wallet.cachedStatus;
      cache.statusUpdatedOn = Date.now();
      cache.isValid = true;
      cache.email = status.preferences ? status.preferences.email : null;
      cacheBalance(wallet, status.balance);
    };

    function walletStatusHash(status) {
      return status ? status.balance.totalAmount : wallet.totalBalanceSat;
    };

    function _getStatus(initStatusHash, tries, cb) {
      if (isStatusCached() && !opts.force) {
        $log.debug('Wallet status cache hit:' + wallet.id);
        cacheStatus(wallet.cachedStatus);
        processPendingTxps(wallet.cachedStatus);
        return cb(null, wallet.cachedStatus);
      };

      tries = tries || 0;

      $log.debug('Updating Status:', wallet.credentials.walletName, tries);
      get(function(err, status) {
        if (err) return cb(err);

        var currentStatusHash = walletStatusHash(status);
        $log.debug('Status update. hash:' + currentStatusHash + ' Try:' + tries);
        if (opts.untilItChanges &&
          initStatusHash == currentStatusHash &&
          tries < root.WALLET_STATUS_MAX_TRIES &&
          walletId == wallet.credentials.walletId) {
          return $timeout(function() {
            $log.debug('Retrying update... ' + walletId + ' Try:' + tries)
            return _getStatus(initStatusHash, ++tries, cb);
          }, root.WALLET_STATUS_DELAY_BETWEEN_TRIES * tries);
        }

        processPendingTxps(status);

        $log.debug('Got Wallet Status for:' + wallet.credentials.walletName);

        cacheStatus(status);

        wallet.scanning = status.wallet && status.wallet.scanStatus == 'running';

        return cb(null, status);
      });
    };

    _getStatus(walletStatusHash(), 0, cb);
  };

  var getSavedTxs = function(walletId, cb) {
    storageService.getTxHistory(walletId, function(err, txs) {
      if (err) return cb(err);

      var localTxs = [];

      if (!txs) {
        return cb(null, localTxs);
      }

      try {
        localTxs = JSON.parse(txs);
      } catch (ex) {
        $log.warn(ex);
      }
      return cb(null, lodash.compact(localTxs));
    });
  };

  var getTxsFromServer = function(wallet, skip, endingTxid, limit, cb) {
    var res = [];

    wallet.getTxHistory({
      skip: skip,
      limit: limit
    }, function(err, txsFromServer) {
      if (err) return cb(err);

      if (!txsFromServer.length)
        return cb();

      var res = lodash.takeWhile(txsFromServer, function(tx) {
        return tx.txid != endingTxid;
      });

      return cb(null, res, res.length >= limit);
    });
  };

  var removeAndMarkSoftConfirmedTx = function(txs) {
    return lodash.filter(txs, function(tx) {
      if (tx.confirmations >= root.SOFT_CONFIRMATION_LIMIT)
        return tx;
      tx.recent = true;
    });
  }

  var processNewTxs = function(wallet, txs) {
    var config = configService.getSync().wallet.settings;
    var now = Math.floor(Date.now() / 1000);
    var txHistoryUnique = {};
    var ret = [];
    wallet.hasUnsafeConfirmed = false;

    lodash.each(txs, function(tx) {
      tx = txFormatService.processTx(wallet.coin, tx);

      // no future transactions...
      if (tx.time > now)
        tx.time = now;

      if (tx.confirmations >= root.SAFE_CONFIRMATIONS) {
        tx.safeConfirmed = root.SAFE_CONFIRMATIONS + '+';
      } else {
        tx.safeConfirmed = false;
        wallet.hasUnsafeConfirmed = true;
      }

      if (tx.note) {
        delete tx.note.encryptedEditedByName;
        delete tx.note.encryptedBody;
      }

      if (!txHistoryUnique[tx.txid]) {
        ret.push(tx);
        txHistoryUnique[tx.txid] = true;
      } else {
        $log.debug('Ignoring duplicate TX in history: ' + tx.txid)
      }
    });

    return ret;
  };

  var updateOnProgress = {};
  var progressFn = {};
  var updateLocalTxHistory = function(wallet, opts, cb) {
    var FIRST_LIMIT = 5;
    var LIMIT = 50;
    var requestLimit = FIRST_LIMIT;
    var walletId = wallet.credentials.walletId;

    var opts = opts || {};
    progressFn[walletId] = opts.progressFn || function() {};
    var foundLimitTx = false;


    if (opts.feeLevels) {
      opts.lowAmount = root.getLowAmount(wallet);
    }

    var fixTxsUnit = function(txs) {
      if (!txs || !txs[0] || !txs[0].amountStr) return;

      var cacheCoin = txs[0].amountStr.split(' ')[1];

      if (cacheCoin == 'bits') {

        $log.debug('Fixing Tx Cache Unit to: ' + wallet.coin)
        lodash.each(txs, function(tx) {
          tx.amountStr = txFormatService.formatAmountStr(wallet.coin, tx.amount);
          tx.feeStr = txFormatService.formatAmountStr(wallet.coin, tx.fees);
        });
      }
    };

    if (updateOnProgress[wallet.id]) {
      $log.warn('History update already on progress for: '+ wallet.credentials.walletName);

      if (opts.progressFn) {
        $log.debug('Rewriting progressFn');
        progressFn[walletId] = opts.progressFn;
      }
      updateOnProgress[wallet.id].push(cb);
      return; // no callback call yet.
    }

    updateOnProgress[walletId] = [cb];

    getSavedTxs(walletId, function(err, txsFromLocal) {
      if (err)  {
        lodash.each(updateOnProgress[wallet.id], function(x) {
          x.apply(self,err);
        });
        updateOnProgress[wallet.id] = false;
      }

      fixTxsUnit(txsFromLocal);

      var confirmedTxs = removeAndMarkSoftConfirmedTx(txsFromLocal);
      var endingTxid = confirmedTxs[0] ? confirmedTxs[0].txid : null;
      var endingTs = confirmedTxs[0] ? confirmedTxs[0].time : null;

      // First update
      progressFn[walletId](txsFromLocal, 0);
      wallet.completeHistory = txsFromLocal;

      function getNewTxs(newTxs, skip, next) {
        getTxsFromServer(wallet, skip, endingTxid, requestLimit, function(err, res, shouldContinue) {
          if (err) {
            $log.warn(bwcError.msg(err, 'Server Error')); //TODO
            if (err instanceof errors.CONNECTION_ERROR || (err.message && err.message.match(/5../))) {
              $log.info('Retrying history download in 5 secs...');
              return $timeout(function() {
                return getNewTxs(newTxs, skip, next);
              }, 5000);
            };
            return next(err);
          }

          newTxs = newTxs.concat(processNewTxs(wallet, lodash.compact(res)));

          progressFn[walletId](newTxs.concat(txsFromLocal), newTxs.length);

          skip = skip + requestLimit;

          $log.debug('Syncing TXs. Got:' + newTxs.length + ' Skip:' + skip, ' EndingTxid:', endingTxid, ' Continue:', shouldContinue);

          // TODO Dirty <HACK>
          // do not sync all history, just looking for a single TX.
          if (opts.limitTx) {

            foundLimitTx = lodash.find(newTxs, {
              txid: opts.limitTx,
            });

            if (foundLimitTx) {
              $log.debug('Found limitTX: ' + opts.limitTx);
              return next(null, [foundLimitTx]);
            }
          }
          // </HACK>


          if (!shouldContinue) {
            $log.debug('Finished Sync: New / soft confirmed Txs: ' + newTxs.length);
            return next(null, newTxs);
          }

          requestLimit = LIMIT;
          getNewTxs(newTxs, skip, next);
        });
      };

      getNewTxs([], 0, function(err, txs) {
        if (err)  {
          lodash.each(updateOnProgress[wallet.id], function(x) {
            x.apply(self,err);
          });
          updateOnProgress[wallet.id] = false;
        }

        var newHistory = lodash.uniq(lodash.compact(txs.concat(confirmedTxs)), function(x) {
          return x.txid;
        });


        function updateNotes(cb2) {
          if (!endingTs) return cb2();

          $log.debug('Syncing notes from: ' + endingTs);
          wallet.getTxNotes({
            minTs: endingTs
          }, function(err, notes) {
            if (err) {
              $log.warn(err);
              return cb2();
            };
            lodash.each(notes, function(note) {
              $log.debug('Note for ' + note.txid);
              lodash.each(newHistory, function(tx) {
                if (tx.txid == note.txid) {
                  $log.debug('...updating note for ' + note.txid);
                  tx.note = note;
                }
              });
            });
            return cb2();
          });
        }

        function updateLowAmount(txs) {
          if (!opts.lowAmount) return;

          lodash.each(txs, function(tx) {
            tx.lowAmount = tx.amount < opts.lowAmount;
          });
        };

        updateLowAmount(txs);

        updateNotes(function() {

          // <HACK>
          if (foundLimitTx) {
            $log.debug('Tx history read until limitTx: ' + opts.limitTx);

            // in this case, only the orig cb is called.
            updateOnProgress[wallet.id] = false;
            return cb(null, newHistory);
          }
          // </HACK>

          var historyToSave = JSON.stringify(newHistory);

          lodash.each(txs, function(tx) {
            tx.recent = true;
          })

          $log.debug('Tx History synced. Total Txs: ' + newHistory.length);

          // Final update
          if (walletId == wallet.credentials.walletId) {
            wallet.completeHistory = newHistory;
          }

          return storageService.setTxHistory(historyToSave, walletId, function() {
            $log.debug('Tx History saved.');
            lodash.each(updateOnProgress[wallet.id], function(x) {
              x.apply(self);
            });
            updateOnProgress[wallet.id] = false;
          });
        });
      });
    });
  };

  root.getTxNote = function(wallet, txid, cb) {
    wallet.getTxNote({
      txid: txid
    }, function(err, note) {
      if (err) return cb(err);
      return cb(null, note);
    });
  };

  root.editTxNote = function(wallet, args, cb) {
    wallet.editTxNote(args, function(err, res) {
      return cb(err, res);
    });
  };

  root.getTxp = function(wallet, txpid, cb) {
    wallet.getTx(txpid, function(err, txp) {
      if (err) return cb(err);
      return cb(null, txp);
    });
  };

  root.getTx = function(wallet, txid, cb) {

    function finish(list) {
      var tx = lodash.find(list, {
        txid: txid
      });

      if (!tx) return cb('Could not get transaction');
      return cb(null, tx);
    };

    if (wallet.completeHistory && wallet.completeHistory.isValid) {
      finish(wallet.completeHistory);
    } else {
      root.getTxHistory(wallet, {
        limitTx: txid
      }, function(err, txHistory) {
        if (err) return cb(err);

        finish(txHistory);
      });
    }
  };


  root.clearTxHistory = function(wallet, cb) {
    root.invalidateCache(wallet);

    storageService.removeTxHistory(wallet.id, function(err) {
      if (err) {
        $log.error(err);
        return cb(err);
      }
      return cb();
    });
  };



  root.getTxHistory = function(wallet, opts, cb) {
    opts = opts || {};

    var walletId = wallet.credentials.walletId;

    if (!wallet.isComplete()) return cb();

    function isHistoryCached() {
      return wallet.completeHistory && wallet.completeHistory.isValid;
    };

    if (isHistoryCached() && !opts.force) {
      return cb(null, wallet.completeHistory);
    }

    $log.debug('Updating Transaction History: ' + wallet.credentials.walletName);

    updateLocalTxHistory(wallet, opts, function(err, txs) {
      if (err) return cb(err);

      if (opts.limitTx) {
        return cb(err, txs);
      }

      wallet.completeHistory.isValid = true;
      return cb(err, wallet.completeHistory);
    });
  };

  root.isEncrypted = function(wallet) {
    if (lodash.isEmpty(wallet)) return;
    var isEncrypted = wallet.isPrivKeyEncrypted();
    if (isEncrypted) $log.debug('Wallet is encrypted');
    return isEncrypted;
  };

  root.createTx = function(wallet, txp, cb) {
    if (lodash.isEmpty(txp) || lodash.isEmpty(wallet))
      return cb('MISSING_PARAMETER');

    wallet.createTxProposal(txp, function(err, createdTxp) {
      if (err) return cb(err);
      else {
        $log.debug('Transaction created');
        return cb(null, createdTxp);
      }
    });
  };

  root.publishTx = function(wallet, txp, cb) {
    if (lodash.isEmpty(txp) || lodash.isEmpty(wallet))
      return cb('MISSING_PARAMETER');

    wallet.publishTxProposal({
      txp: txp
    }, function(err, publishedTx) {
      if (err) return cb(err);
      else {
        $log.debug('Transaction published');
        return cb(null, publishedTx);
      }
    });
  };

  root.signTx = function(wallet, txp, password, cb) {
    if (!wallet || !txp || !cb)
      return cb('MISSING_PARAMETER');

    if (wallet.isPrivKeyExternal()) {
      switch (wallet.getPrivKeyExternalSourceName()) {
        case root.externalSource.ledger.id:
          return _signWithLedger(wallet, txp, cb);
        case root.externalSource.trezor.id:
          return _signWithTrezor(wallet, txp, cb);
        case root.externalSource.intelTEE.id:
          return _signWithIntelTEE(wallet, txp, cb);
        default:
          var msg = 'Unsupported External Key:' + wallet.getPrivKeyExternalSourceName();
          $log.error(msg);
          return cb(msg);
      }
    } else {

      try {
        wallet.signTxProposal(txp, password, function(err, signedTxp) {
          $log.debug('Transaction signed err:' + err);
          return cb(err, signedTxp);
        });
      } catch (e) {
        $log.warn('Error at signTxProposal:', e);
        return cb(e);
      }
    }
  };

  root.broadcastTx = function(wallet, txp, cb) {
    if (lodash.isEmpty(txp) || lodash.isEmpty(wallet))
      return cb('MISSING_PARAMETER');

    if (txp.status != 'accepted')
      return cb('TX_NOT_ACCEPTED');

    wallet.broadcastTxProposal(txp, function(err, broadcastedTxp, memo) {
      if (err)
        return cb(err);

      $log.debug('Transaction broadcasted');
      if (memo) $log.info(memo);

      return cb(null, broadcastedTxp);
    });
  };

  root.rejectTx = function(wallet, txp, cb) {
    if (lodash.isEmpty(txp) || lodash.isEmpty(wallet))
      return cb('MISSING_PARAMETER');

    wallet.rejectTxProposal(txp, null, function(err, rejectedTxp) {
      $log.debug('Transaction rejected');
      return cb(err, rejectedTxp);
    });
  };

  root.removeTx = function(wallet, txp, cb) {
    if (lodash.isEmpty(txp) || lodash.isEmpty(wallet))
      return cb('MISSING_PARAMETER');

    wallet.removeTxProposal(txp, function(err) {
      $log.debug('Transaction removed');

      root.invalidateCache(wallet);
      $rootScope.$emit('Local/TxAction', wallet.id);

      return cb(err);
    });
  };

  root.updateRemotePreferences = function(clients, prefs, cb) {
    prefs = prefs || {};
    cb = cb || function() {};

    if (!lodash.isArray(clients))
      clients = [clients];

    function updateRemotePreferencesFor(clients, prefs, next) {
      var wallet = clients.shift();
      if (!wallet) return next();
      $log.debug('Saving remote preferences', wallet.credentials.walletName, prefs);

      wallet.savePreferences(prefs, function(err) {

        if (err) {
          popupService.showAlert(bwcError.msg(err, gettextCatalog.getString('Could not save preferences on the server')));
          return next(err);
        }

        updateRemotePreferencesFor(clients, prefs, next);
      });
    };

    // Update this JIC.
    var config = configService.getSync();
    var walletSettings = config.wallet.settings;

    //prefs.email  (may come from arguments)
    prefs.email = config.emailNotifications.email;
    prefs.language = uxLanguage.getCurrentLanguage();
    // prefs.unit = walletSettings.unitCode; // TODO: remove, not used

    updateRemotePreferencesFor(lodash.clone(clients), prefs, function(err) {
      if (err) return cb(err);

      $log.debug('Remote preferences saved for' + lodash.map(clients, function(x) {
        return x.credentials.walletId;
      }).join(','));

      lodash.each(clients, function(c) {
        c.preferences = lodash.assign(prefs, c.preferences);
      });
      return cb();
    });
  };

  root.recreate = function(wallet, cb) {
    $log.debug('Recreating wallet:', wallet.id);
    ongoingProcess.set('recreating', true);
    wallet.recreateWallet(function(err) {
      wallet.notAuthorized = false;
      ongoingProcess.set('recreating', false);
      return cb(err);
    });
  };

  root.startScan = function(wallet, cb) {
    cb = cb || function() {};

    $log.debug('Scanning wallet ' + wallet.id);
    if (!wallet.isComplete()) return;

    wallet.scanning = true;
    wallet.startScan({
      includeCopayerBranches: true,
    }, function(err) {
      return cb(err);
    });
  };


  root.expireAddress = function(wallet, cb) {
    $log.debug('Cleaning Address ' + wallet.id);
    storageService.clearLastAddress(wallet.id, function(err) {
      return cb(err);
    });
  };

  // Check address
  root.isAddressUsed = function(wallet, byAddress, cb) {
    storageService.getLastAddress(wallet.id, function(err, addr) {
      var used = lodash.find(byAddress, {
        address: addr
      });
      return cb(err, used);
    });
  };

  var createAddress = function(wallet, cb) {
    $log.debug('Creating address for wallet:', wallet.id);

    wallet.createAddress({}, function(err, addr) {
      if (err) {
        var prefix = gettextCatalog.getString('Could not create address');
        if (err instanceof errors.CONNECTION_ERROR || (err.message && err.message.match(/5../))) {
          $log.warn(err);
          return $timeout(function() {
            createAddress(wallet, cb);
          }, 5000);
        } else if (err instanceof errors.MAIN_ADDRESS_GAP_REACHED || (err.message && err.message == 'MAIN_ADDRESS_GAP_REACHED')) {
          $log.warn(err);
          prefix = null;
          wallet.getMainAddresses({
            reverse: true,
            limit: 1
          }, function(err, addr) {
            if (err) return cb(err);
            return cb(null, addr[0].address);
          });
        }
        return bwcError.cb(err, prefix, cb);
      }
      return cb(null, addr.address);
    });
  };

  root.getMainAddresses = function(wallet, opts, cb) {
    opts = opts || {};
    opts.reverse = true;
    wallet.getMainAddresses(opts, function(err, addresses) {
      return cb(err, addresses);
    });
  };

  root.getBalance = function(wallet, opts, cb) {
    opts = opts || {};
    wallet.getBalance(opts, function(err, resp) {
      return cb(err, resp);
    });
  };


  // These 2 functions were taken from
  // https://github.com/bitpay/bitcore-wallet-service/blob/master/lib/model/txproposal.js#L243

  function getEstimatedSizeForSingleInput(wallet) {
    switch (wallet.credentials.addressType) {
      case 'P2PKH':
        return 147;
      default:
      case 'P2SH':
        return wallet.m * 72 + wallet.n * 36 + 44;
    }
  };


  root.getEstimatedTxSize = function(wallet, nbOutputs) {
    // Note: found empirically based on all multisig P2SH inputs and within m & n allowed limits.
    var safetyMargin = 0.02;

    var overhead = 4 + 4 + 9 + 9;
    var inputSize = getEstimatedSizeForSingleInput(wallet);
    var outputSize = 34;
    var nbInputs = 1; //Assume 1 input
    var nbOutputs = nbOutputs || 2; // Assume 2 outputs

    var size = overhead + inputSize * nbInputs + outputSize * nbOutputs;
    return parseInt((size * (1 + safetyMargin)).toFixed(0));
  };


  // Approx utxo amount, from which the uxto is economically redeemable
  root.getMinFee = function(wallet, nbOutputs) {
    var levels = feeService.cachedFeeLevels;
    var lowLevelRate = (lodash.find(levels[wallet.network], {
      level: 'normal',
    }).feePerKb / 1000).toFixed(0);

    var size = root.getEstimatedTxSize(wallet, nbOutputs);
      return size * lowLevelRate;
  };


  // Approx utxo amount, from which the uxto is economically redeemable
  root.getLowAmount = function(wallet, nbOutputs) {
    var minFee = root.getMinFee(wallet, nbOutputs);
    return parseInt(minFee / LOW_AMOUNT_RATIO);
  };



  root.getLowUtxos = function(wallet, cb) {

    wallet.getUtxos({
      coin: wallet.coin
    }, function(err, resp) {
      if (err || !resp || !resp.length) return cb();

      var minFee = root.getMinFee(wallet, resp.length);

      var balance = lodash.sum(resp, 'satoshis');

      // for 2 outputs
      var lowAmount = root.getLowAmount(wallet);
      var lowUtxos = lodash.filter(resp, function(x) {
        return x.satoshis < lowAmount;
      });

      var totalLow = lodash.sum(lowUtxos, 'satoshis');

      return cb(err, {
        allUtxos: resp || [],
        lowUtxos: lowUtxos || [],
        warning: minFee / balance > TOTAL_LOW_WARNING_RATIO,
        minFee: minFee,
      });
    });
  };

  root.useLegacyAddress = function(wallet) {
    var config = configService.getSync();
    var walletSettings = config.wallet;

    return walletSettings.useLegacyAddress;
  };


  root.getAddressView = function(wallet, address) {
    if (wallet.coin != 'bch' || root.useLegacyAddress(wallet)) return address;
    return txFormatService.toCashAddress(address);
  };

  root.getProtoAddress = function(wallet, address) {
    var proto  = root.getProtocolHandler(wallet);
    var protoAddr = proto + ':' + address;

    if (wallet.coin != 'bch' || root.useLegacyAddress(wallet)) {
      return protoAddr;
    } else {
      return protoAddr.toUpperCase() ;
    };
  };

  root.getAddress = function(wallet, forceNew, cb) {
    storageService.getLastAddress(wallet.id, function(err, addr) {
      if (err) return cb(err);

      if (!forceNew && addr) return cb(null, addr);

      if (!wallet.isComplete())
        return cb('WALLET_NOT_COMPLETE');

      createAddress(wallet, function(err, _addr) {
        if (err) return cb(err, addr);
        storageService.storeLastAddress(wallet.id, _addr, function() {
          if (err) return cb(err);
          return cb(null, _addr);
        });
      });
    });
  };

  root.getAddressObj = function(wallet, address, cb) {
    wallet.getMainAddresses({
      reverse: true
    }, function(err, addr) {
      if (err) return cb(err);
      var addrObj = lodash.find(addr, function(a) {
        return a.address == address;
      });
      var err = null;
      if (!addrObj) {
        err = 'Error: specified address not in wallet';
      }
      return cb(err, addrObj);
    });
  };

  root.isReady = function(wallet, cb) {
    if (!wallet.isComplete())
      return cb('WALLET_NOT_COMPLETE');

    if (wallet.needsBackup)
      return cb('WALLET_NEEDS_BACKUP');
    return cb();
  };


  // An alert dialog
  var askPassword = function(name, title, cb) {
    var opts = {
      inputType: 'password',
      forceHTMLPrompt: true,
      class: 'text-warn'
    };
    popupService.showPrompt(title, name, opts, function(res) {
      if (!res) return cb();
      if (res) return cb(res)
    });
  };


  root.encrypt = function(wallet, cb) {
    var title = gettextCatalog.getString('Enter new spending password');
    var warnMsg = gettextCatalog.getString('Your wallet key will be encrypted. The Spending Password cannot be recovered. Be sure to write it down.');
    askPassword(warnMsg, title, function(password) {
      if (!password) return cb('no password');
      title = gettextCatalog.getString('Confirm your new spending password');
      askPassword(warnMsg, title, function(password2) {
        if (!password2 || password != password2)
          return cb('password mismatch');

        wallet.encryptPrivateKey(password);
        return cb();
      });
    });
  };


  root.decrypt = function(wallet, cb) {
    $log.debug('Disabling private key encryption for' + wallet.name);
    askPassword(null, gettextCatalog.getString('Enter Spending Password'), function(password) {
      if (!password) return cb('no password');

      try {
        wallet.decryptPrivateKey(password);
      } catch (e) {
        return cb(e);
      }
      return cb();
    });
  };

  root.handleEncryptedWallet = function(wallet, cb) {
    if (!root.isEncrypted(wallet)) return cb();

    askPassword(wallet.name, gettextCatalog.getString('Enter Spending Password'), function(password) {
      if (!password) return cb('No password');
      if (!wallet.checkPassword(password)) return cb('Wrong password');

      return cb(null, password);
    });
  };


  root.reject = function(wallet, txp, cb) {
    ongoingProcess.set('rejectTx', true);
    root.rejectTx(wallet, txp, function(err, txpr) {
      root.invalidateCache(wallet);
      ongoingProcess.set('rejectTx', false);

      if (err) return cb(err);

      $rootScope.$emit('Local/TxAction', wallet.id);
      return cb(null, txpr);
    });
  };


  root.onlyPublish = function(wallet, txp, cb, customStatusHandler) {
    ongoingProcess.set('sendingTx', true, customStatusHandler);
    root.publishTx(wallet, txp, function(err, publishedTxp) {
      root.invalidateCache(wallet);
      ongoingProcess.set('sendingTx', false, customStatusHandler);
      if (err) return cb(bwcError.msg(err));
      $rootScope.$emit('Local/TxAction', wallet.id);
      return cb();
    });
  };


  root.prepare = function(wallet, cb) {
    fingerprintService.check(wallet, function(err) {
      if (err) return cb(err);

      root.handleEncryptedWallet(wallet, function(err, password) {
        if (err) return cb(err);

        return cb(null, password);
      });
    });
  };

  root.publishAndSign = function(wallet, txp, cb, customStatusHandler) {

    var publishFn = root.publishTx;

    // Already published?
    if (txp.status == 'pending') {
      publishFn = function(wallet, txp, cb) {
        return cb(null, txp);
      };
    }

    root.prepare(wallet, function(err, password) {
      if (err) return cb(bwcError.msg(err));

      ongoingProcess.set('sendingTx', true, customStatusHandler);

      publishFn(wallet, txp, function(err, publishedTxp) {
        ongoingProcess.set('sendingTx', false, customStatusHandler);
        if (err) return cb(bwcError.msg(err));

        ongoingProcess.set('signingTx', true, customStatusHandler);
        root.signTx(wallet, publishedTxp, password, function(err, signedTxp) {
          ongoingProcess.set('signingTx', false, customStatusHandler);
          root.invalidateCache(wallet);


          if (err) {
            $log.warn('sign error:' + err);
            var msg = err && err.message ?
              err.message :
              gettextCatalog.getString('The payment was created but could not be completed. Please try again from home screen');

            $rootScope.$emit('Local/TxAction', wallet.id);
            return cb(msg);
          }

          if (signedTxp.status == 'accepted') {
            ongoingProcess.set('broadcastingTx', true, customStatusHandler);
            root.broadcastTx(wallet, signedTxp, function(err, broadcastedTxp) {
              ongoingProcess.set('broadcastingTx', false, customStatusHandler);
              if (err) return cb(bwcError.msg(err));

              $rootScope.$emit('Local/TxAction', wallet.id);
              return cb(null, broadcastedTxp);
            });
          } else {
            $rootScope.$emit('Local/TxAction', wallet.id);
            return cb(null, signedTxp);
          }
        });
      });
    });
  };

  root.getEncodedWalletInfo = function(wallet, password, cb) {
    var derivationPath = wallet.credentials.getBaseAddressDerivationPath();
    var encodingType = {
      mnemonic: 1,
      xpriv: 2,
      xpub: 3
    };
    var info;

    // not supported yet
    if (wallet.credentials.derivationStrategy != 'BIP44' || !wallet.canSign())
      return cb(gettextCatalog.getString('Exporting via QR not supported for this wallet'));

    var keys = root.getKeysWithPassword(wallet, password);

    if (keys.mnemonic) {
      info = {
        type: encodingType.mnemonic,
        data: keys.mnemonic,
      }
    } else {
      info = {
        type: encodingType.xpriv,
        data: keys.xPrivKey
      }
    }

    return cb(null, info.type + '|' + info.data + '|' + wallet.credentials.network.toLowerCase() + '|' + derivationPath + '|' + (wallet.credentials.mnemonicHasPassphrase));
  };

  root.setTouchId = function(wallet, enabled, cb) {

    var opts = {
      touchIdFor: {}
    };
    opts.touchIdFor[wallet.id] = enabled;

    fingerprintService.check(wallet, function(err) {
      if (err) {
        opts.touchIdFor[wallet.id] = !enabled;
        $log.debug('Error with fingerprint:' + err);
        return cb(err);
      }
      configService.set(opts, cb);
    });
  };

  root.getKeys = function(wallet, cb) {
    root.prepare(wallet, function(err, password) {
      if (err) return cb(err);
      var keys;

      try {
        keys = wallet.getKeys(password);
      } catch (e) {
        return cb(e);
      }

      return cb(null, keys);
    });
  };

  root.getKeysWithPassword = function(wallet, password) {
    try {
      return wallet.getKeys(password);
    } catch (e) {}
  }

  root.getSendMaxInfo = function(wallet, opts, cb) {
    opts = opts || {};
    wallet.getSendMaxInfo(opts, function(err, res) {
      return cb(err, res);
    });
  };

  root.getProtocolHandler = function(wallet) {

    if (wallet.coin== 'bch') {
      return 'bitcoincash';
    } else {
      return 'bitcoin';
    }
  }


  root.copyCopayers = function(wallet, newWallet, cb) {
    var c = wallet.credentials;

    var walletPrivKey = bitcore.PrivateKey.fromString(c.walletPrivKey);

    var copayer = 1,
      i = 0,
      l = c.publicKeyRing.length;
    var mainErr = null;

    lodash.each(c.publicKeyRing, function(item) {
      var name = item.copayerName || ('copayer ' + copayer++);
      newWallet._doJoinWallet(newWallet.credentials.walletId, walletPrivKey, item.xPubKey, item.requestPubKey, name, {
        coin: newWallet.credentials.coin,
      }, function(err) {
        //Ignore error is copayer already in wallet
        if (err && !(err instanceof errors.COPAYER_IN_WALLET)) {
          mainErr = err;
        }

        if (++i == l) {
          return cb(mainErr);
        }
      });
    });
  };

  return root;
});
