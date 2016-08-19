'use strict';

angular.module('copayApp.services').factory('walletService', function($log, $timeout, lodash, trezor, ledger, storageService, configService, rateService, uxLanguage, $filter, gettextCatalog, bwcError, $ionicPopup, fingerprintService, ongoingProcess, gettext, $rootScope, txStatus, txFormatService, $ionicModal, $state) {
  // `wallet` is a decorated version of client.

  var root = {};

  root.WALLET_STATUS_MAX_TRIES = 7;
  root.WALLET_STATUS_DELAY_BETWEEN_TRIES = 1.4 * 1000;
  root.SOFT_CONFIRMATION_LIMIT = 12;
  root.SAFE_CONFIRMATIONS = 6;

  // UI Related
  root.openStatusModal = function(type, txp, cb) {
    var scope = $rootScope.$new(true);
    scope.type = type;
    scope.tx = txFormatService.processTx(txp);
    scope.color = txp.color;
    scope.cb = cb;

    $ionicModal.fromTemplateUrl('views/modals/tx-status.html', {
      scope: scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      scope.txStatusModal = modal;
      scope.txStatusModal.show();
    });
  };

  // // RECEIVE
  // // Check address
  // root.isUsed(wallet.walletId, balance.byAddress, function(err, used) {
  //   if (used) {
  //     $log.debug('Address used. Creating new');
  //     $rootScope.$emit('Local/AddressIsUsed');
  //   }
  // });
  //

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

  root.requiresBackup = function(wallet) {
    if (wallet.isPrivKeyExternal()) return false;
    if (!wallet.credentials.mnemonic) return false;
    if (wallet.credentials.network == 'testnet') return false;

    return true;
  };

  root.needsBackup = function(wallet, cb) {

    if (!root.requiresBackup(wallet))
      return cb(false);

    storageService.getBackupFlag(wallet.credentials.walletId, function(err, val) {
      if (err) $log.error(err);
      if (val) return cb(false);
      return cb(true);
    });
  };


  // TODO
  // This handles errors from BWS/index which normally
  // trigger from async events (like updates).
  // Debounce function avoids multiple popups
  var _handleError = function(err) {
    $log.warn('wallet ERROR: ', err);

    $log.warn('TODO');
    return; // TODO!!!
    if (err instanceof errors.NOT_AUTHORIZED) {

      console.log('[walletService.js.93] TODO NOT AUTH'); //TODO
      // TODO  TODO  TODO  TODO  TODO  TODO  TODO  TODO  TODO  TODO  TODO  TODO  TODO  TODO
      wallet.notAuthorized = true;
      $state.go('tabs.home');
    } else if (err instanceof errors.NOT_FOUND) {
      root.showErrorPopup(gettext('Could not access Wallet Service: Not found'));
    } else {
      var msg = ""
      $rootScope.$emit('Local/ClientError', (err.error ? err.error : err));
      var msg = bwcError.msg(err, gettext('Error at Wallet Service'));
      root.showErrorPopup(msg);
    }
  };
  root.handleError = lodash.debounce(_handleError, 1000);

  root.getStatus = function(wallet, opts, cb) {
    opts = opts || {};

    function get(cb) {
      wallet.getStatus({
        twoStep: true
      }, function(err, ret) {
        if (err) {
          return cb(bwcError.msg(err, gettext('Could not update Wallet')));
        }
        return cb(null, ret);
      });
    };

    function cacheBalance(wallet, balance) {
      if (!balance) return;

      var config = configService.getSync().wallet.settings;

      var cache = wallet.cachedStatus;

      // Address with Balance
      cache.balanceByAddress = balance.byAddress;

      // Spend unconfirmed funds
      if (cache.spendUnconfirmed) {
        cache.totalBalanceSat = balance.totalAmount;
        cache.lockedBalanceSat = balance.lockedAmount;
        cache.availableBalanceSat = balance.availableAmount;
        cache.totalBytesToSendMax = balance.totalBytesToSendMax;
        cache.pendingAmount = null;
      } else {
        cache.totalBalanceSat = balance.totalConfirmedAmount;
        cache.lockedBalanceSat = balance.lockedConfirmedAmount;
        cache.availableBalanceSat = balance.availableConfirmedAmount;
        cache.totalBytesToSendMax = balance.totalBytesToSendConfirmedMax;
        cache.pendingAmount = balance.totalAmount - balance.totalConfirmedAmount;
      }

      // Selected unit
      cache.unitToSatoshi = config.unitToSatoshi;
      cache.satToUnit = 1 / cache.unitToSatoshi;
      cache.unitName = config.unitName;

      //STR
      cache.totalBalanceStr = txFormatService.formatAmount(cache.totalBalanceSat) + ' ' + cache.unitName;
      cache.lockedBalanceStr = txFormatService.formatAmount(cache.lockedBalanceSat) + ' ' + cache.unitName;
      cache.availableBalanceStr = txFormatService.formatAmount(cache.availableBalanceSat) + ' ' + cache.unitName;

      if (cache.pendingAmount) {
        cache.pendingAmountStr = txFormatService.formatAmount(cache.pendingAmount) + ' ' + cache.unitName;
      } else {
        cache.pendingAmountStr = null;
      }

      cache.alternativeName = config.alternativeName;
      cache.alternativeIsoCode = config.alternativeIsoCode;

      rateService.whenAvailable(function() {

        var totalBalanceAlternative = rateService.toFiat(cache.totalBalanceSat, cache.alternativeIsoCode);
        var lockedBalanceAlternative = rateService.toFiat(cache.lockedBalanceSat, cache.alternativeIsoCode);
        var alternativeConversionRate = rateService.toFiat(100000000, cache.alternativeIsoCode);

        cache.totalBalanceAlternative = $filter('formatFiatAmount')(totalBalanceAlternative);
        cache.lockedBalanceAlternative = $filter('formatFiatAmount')(lockedBalanceAlternative);
        cache.alternativeConversionRate = $filter('formatFiatAmount')(alternativeConversionRate);

        cache.alternativeBalanceAvailable = true;
        cache.isRateAvailable = true;
      });
    };

    function isStatusCached() {
      return wallet.cachedStatus && wallet.cachedStatus.isValid;
    };

    function cacheStatus(status) {
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
      if (isStatusCached() && !opts.force) return cb(null, wallet.cachedStatus);

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

        $log.debug('Got Wallet Status for:' + wallet.credentials.walletName);

        cacheStatus(status);

        // wallet.setPendingTxps(status.pendingTxps);
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

      return cb(null, res, res.length == limit);
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
      tx = txFormatService.processTx(tx);

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

  var updateLocalTxHistory = function(wallet, progressFn, cb) {
    var FIRST_LIMIT = 5;
    var LIMIT = 50;
    var requestLimit = FIRST_LIMIT;
    var walletId = wallet.credentials.walletId;
    var config = configService.getSync().wallet.settings;

    progressFn = progressFn || function() {};

    var fixTxsUnit = function(txs) {
      if (!txs || !txs[0] || !txs[0].amountStr) return;

      var cacheUnit = txs[0].amountStr.split(' ')[1];

      if (cacheUnit == config.unitName)
        return;

      var name = ' ' + config.unitName;

      $log.debug('Fixing Tx Cache Unit to:' + name)
      lodash.each(txs, function(tx) {

        tx.amountStr = txFormatService.formatAmount(tx.amount) + name;
        tx.feeStr = txFormatService.formatAmount(tx.fees) + name;
      });
    };

    getSavedTxs(walletId, function(err, txsFromLocal) {
      if (err) return cb(err);

      fixTxsUnit(txsFromLocal);

      var confirmedTxs = removeAndMarkSoftConfirmedTx(txsFromLocal);
      var endingTxid = confirmedTxs[0] ? confirmedTxs[0].txid : null;
      var endingTs = confirmedTxs[0] ? confirmedTxs[0].time : null;


      // First update
      wallet.completeHistory = txsFromLocal;

      function getNewTxs(newTxs, skip, cb) {
        getTxsFromServer(wallet, skip, endingTxid, requestLimit, function(err, res, shouldContinue) {
          if (err) return cb(err);

          newTxs = newTxs.concat(processNewTxs(wallet, lodash.compact(res)));

          progressFn(newTxs);

          skip = skip + requestLimit;

          $log.debug('Syncing TXs. Got:' + newTxs.length + ' Skip:' + skip, ' EndingTxid:', endingTxid, ' Continue:', shouldContinue);

          if (!shouldContinue) {
            $log.debug('Finished Sync: New / soft confirmed Txs: ' + newTxs.length);
            return cb(null, newTxs);
          }

          requestLimit = LIMIT;
          getNewTxs(newTxs, skip, cb);
        });
      };

      getNewTxs([], 0, function(err, txs) {
        if (err) return cb(err);

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

        updateNotes(function() {
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

            return cb();
          });
        });
      });
    });
  };


  root.getTxHistory = function(wallet, opts, cb) {
    opts = opts || {};

    var walletId = wallet.credentials.walletId;

    if (!wallet.isComplete()) return cb();

    $log.debug('Updating Transaction History');

    updateLocalTxHistory(wallet, opts.progressFn, function(err) {
      if (err) return cb(err);
      return cb(err, wallet.completeHistory);
    });
  };




  root.isEncrypted = function(wallet) {
    if (lodash.isEmpty(wallet)) return;
    var isEncrypted = wallet.isPrivKeyEncrypted();
    if (isEncrypted) $log.debug('Wallet is encrypted');
    return isEncrypted;
  };

  root.lock = function(wallet) {
    try {
      wallet.lock();
    } catch (e) {
      $log.warn('Encrypting wallet:', e);
    };
  };

  root.unlock = function(wallet, password) {
    if (lodash.isEmpty(wallet))
      return 'MISSING_PARAMETER';
    if (lodash.isEmpty(password))
      return 'NO_PASSWORD_GIVEN';
    try {
      wallet.unlock(password);
    } catch (e) {
      $log.warn('Decrypting wallet:', e);
      return 'PASSWORD_INCORRECT';
    }
  };

  root.createTx = function(wallet, txp, cb) {
    if (lodash.isEmpty(txp) || lodash.isEmpty(wallet))
      return cb('MISSING_PARAMETER');

    if (txp.sendMax) {
      wallet.createTxProposal(txp, function(err, createdTxp) {
        if (err) return cb(err);
        else return cb(null, createdTxp);
      });
    } else {
      wallet.getFeeLevels(wallet.credentials.network, function(err, levels) {
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
        wallet.createTxProposal(txp, function(err, createdTxp) {
          if (err) return cb(err);
          else {
            $log.debug('Transaction created');
            return cb(null, createdTxp);
          }
        });
      });
    }
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

  root.signTx = function(wallet, txp, cb) {
    if (lodash.isEmpty(txp) || lodash.isEmpty(wallet))
      return cb('MISSING_PARAMETER');

    if (wallet.isPrivKeyExternal()) {
      switch (wallet.getPrivKeyExternalSourceName()) {
        case 'ledger':
          return _signWithLedger(wallet, txp, cb);
        case 'trezor':
          return _signWithTrezor(wallet, txp, cb);
        default:
          var msg = 'Unsupported External Key:' + wallet.getPrivKeyExternalSourceName();
          $log.error(msg);
          return cb(msg);
      }
    } else {

      try {
        wallet.signTxProposal(txp, function(err, signedTxp) {
          $log.debug('Transaction signed');
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
      return cb(err);
    });
  };

  root.updateRemotePreferences = function(clients, prefs, cb) {
    prefs = prefs || {};

    if (!lodash.isArray(clients))
      clients = [clients];

    function updateRemotePreferencesFor(clients, prefs, cb) {
      var wallet = clients.shift();
      if (!wallet) return cb();
      $log.debug('Saving remote preferences', wallet.credentials.walletName, prefs);

      wallet.savePreferences(prefs, function(err) {
        // we ignore errors here
        if (err) $log.warn(err);

        updateRemotePreferencesFor(clients, prefs, cb);
      });
    };

    // Update this JIC.
    var config = configService.getSync().wallet.settings;

    //prefs.email  (may come from arguments)
    prefs.language = uxLanguage.getCurrentLanguage();
    prefs.unit = config.unitCode;

    updateRemotePreferencesFor(clients, prefs, function(err) {
      if (err) return cb(err);

      lodash.each(clients, function(c) {
        c.preferences = lodash.assign(prefs, c.preferences);
      });
      return cb();
    });
  };

  root.debounceUpdateHistory = lodash.debounce(function() {
    root.updateHistory();
  }, 1000);

  root.throttledUpdateHistory = lodash.throttle(function() {
    root.updateHistory();
  }, 5000);

  root.showErrorPopup = function(msg, cb) {
    $log.warn('Showing err popup:' + msg);

    // An alert dialog
    var alertPopup = $ionicPopup.alert({
      title: title,
      template: msg
    });

    if (!cb) cb = function() {};

    alertPopup.then(cb);
  };

  // walletHome
  root.recreate = function(wallet, cb) {
    ongoingProcess.set('recreating', true);
    wallet.recreateWallet(function(err) {
      wallet.notAuthorized = false;
      ongoingProcess.set('recreating', false);

      if (err) {
        handleError(err);
        return;
      }

      profileService.bindWalletClient(wallet, {
        force: true
      });
      wallet.startScan(wallet);
    });
  };

  root.startScan = function(wallet) {
    $log.debug('Scanning wallet ' + wallet.credentials.walletId);
    if (!wallet.isComplete()) return;

    //      wallet.updating = true;

    wallet.startScan({
      includeCopayerBranches: true,
    }, function(err) {

       if (err && wallet.walletId == walletId) {
         wallet.updating = false;
         handleError(err);
       }
    });
  };


  root.expireAddress = function(wallet, cb) {
    $log.debug('Cleaning Address ' + wallet.id);
    storageService.clearLastAddress(wallet.id, function(err) {
      return cb(err);
    });
  };

  root.isUsed = function(wallet, byAddress, cb) {
    storageService.getLastAddress(wallet.id, function(err, addr) {
      var used = lodash.find(byAddress, {
        address: addr
      });
      return cb(null, used);
    });
  };

  var createAddress = function(wallet, cb) {
    $log.debug('Creating address for wallet:', wallet.id);

    wallet.createAddress({}, function(err, addr) {
      if (err) {
        var prefix = gettextCatalog.getString('Could not create address');
        if (err.error && err.error.match(/locked/gi)) {
          $log.debug(err.error);
          return $timeout(function() {
            createAddress(wallet, cb);
          }, 5000);
        } else if (err.message && err.message == 'MAIN_ADDRESS_GAP_REACHED') {
          $log.warn(err.message);
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

  root.getAddress = function(wallet, forceNew, cb) {
    console.log('[walletService.js.786:wallet:]', wallet, forceNew); //TODO

    var firstStep;
    if (forceNew) {
      firstStep = storageService.clearLastAddress;
    } else {
      firstStep = function(walletId, cb) {
        return cb();
      };
    }

    firstStep(wallet.id, function(err) {
      if (err) return cb(err);

      storageService.getLastAddress(wallet.id, function(err, addr) {
        if (err) return cb(err);

        if (addr) return cb(null, addr);

        createAddress(wallet, function(err, addr) {
          if (err) return cb(err);
          storageService.storeLastAddress(wallet.id, addr, function() {
            if (err) return cb(err);
            return cb(null, addr);
          });
        });
      });
    });
  };


  root.isReady = function(wallet, cb) {
    if (!wallet.isComplete())
      return cb('WALLET_NOT_COMPLETE');

    root.needsBackup(wallet, function(needsBackup) {
      if (needsBackup)
        return cb('WALLET_NEEDS_BACKUP');
      return cb();
    });
  };


  // An alert dialog
  var askPassword = function(name, cb) {
    var scope = $rootScope.$new(true);
    scope.data = [];
    var pass = $ionicPopup.show({
      template: '<input type="password" ng-model="data.pass">',
      title: 'Enter Spending Password',
      subTitle: name,
      scope: scope,
      buttons: [{
        text: 'Cancel'
      }, {
        text: '<b>OK</b>',
        type: 'button-positive',
        onTap: function(e) {
          if (!scope.data.pass) {
            //don't allow the user to close unless he enters wifi password
            e.preventDefault();
            return;

          }

          return scope.data.pass;
        }
      }]
    });
    pass.then(function(res) {
      return cb(res);
    });
  };

  root.handleEncryptedWallet = function(wallet, cb) {
    if (!root.isEncrypted(wallet)) return cb();

    askPassword(wallet.name, function(password) {
      if (!password) return cb('no password');
      return cb(root.unlock(wallet, password));
    });
  };

  root.onlyPublish = function(wallet, txp, cb) {
    ongoingProcess.set('sendingTx', true);
    root.publishTx(wallet, txp, function(err, publishedTxp) {
      ongoingProcess.set('sendingTx', false);
      if (err) return cb(err);

      var type = txStatus.notify(createdTxp);
      root.openStatusModal(type, createdTxp, function() {
        // TODO?
        //return $scope.$emit('Local/TxProposalAction');
      });

      return cb(null, publishedTxp);
    });
  };

  root.publishAndSign = function(wallet, txp, cb) {

    var publishFn = root.publishTx;

    // Already published?
    if (txp.status == 'pending') {
      publishFn = function(wallet, txp, cb) {
        return cb(null, txp);
      };
    }

    fingerprintService.check(wallet, function(err) {
      if (err) return cb(err);

      root.handleEncryptedWallet(wallet, function(err) {
        if (err) return cb(err);

        ongoingProcess.set('sendingTx', true);
        publishFn(wallet, txp, function(err, publishedTxp) {
          ongoingProcess.set('sendingTx', false);
          if (err) return cb(err);

          ongoingProcess.set('signingTx', true);
          root.signTx(wallet, publishedTxp, function(err, signedTxp) {
            ongoingProcess.set('signingTx', false);
            root.lock(wallet);

            if (err) {
              // TODO?
              //$scope.$emit('Local/TxProposalAction');
              var msg = err.message ?
                err.message :
                gettext('The payment was created but could not be completed. Please try again from home screen');
              return cb(err);
            }

            if (signedTxp.status == 'accepted') {
              ongoingProcess.set('broadcastingTx', true);
              root.broadcastTx(wallet, signedTxp, function(err, broadcastedTxp) {
                ongoingProcess.set('broadcastingTx', false);
                if (err) return cb(err);

                var type = txStatus.notify(broadcastedTxp);
                root.openStatusModal(type, broadcastedTxp, function() {
                  // TODO?
                  //$scope.$emit('Local/TxProposalAction', broadcastedTxp.status == 'broadcasted');
                });

                return cb(null, broadcastedTxp)
              });
            } else {
              var type = txStatus.notify(signedTxp);
              root.openStatusModal(type, signedTxp, function() {
                // TODO?
                //$scope.$emit('Local/TxProposalAction');
              });
              return cb(null, signedTxp);
            }
          });
        });
      });
    });
  };
  root.getEncodedWalletInfo = function(wallet,cb){

    var getCode = function() {
        var derivationPath = wallet.credentials.getBaseAddressDerivationPath();
        var encodingType = {
          mnemonic: 1,
          xpriv: 2,
          xpub: 3
        };
        var info;

        // not supported yet
        if (wallet.credentials.derivationStrategy != 'BIP44' || !wallet.canSign())
          return null;

        if (wallet.credentials.mnemonic) {
          info = {
            type: encodingType.mnemonic,
            data: wallet.credentials.mnemonic,
          }
        } else {
          info = {
            type: encodingType.xpriv,
            data: wallet.credentials.xPrivKey
          }
        }
        return info.type + '|' + info.data + '|' + wallet.credentials.network.toLowerCase() + '|' + derivationPath + '|' + (wallet.credentials.mnemonicHasPassphrase);
    };

    fingerprintService.check(wallet, function(err) {
      if (err) return cb(err);

      root.handleEncryptedWallet(wallet, function(err) {
        if (err) return cb(err);

        var code = getCode();
console.log('[walletService.js.948:code:]',code); //TODO
        return cb(null, code);
      });
    });
  };

  return root;
});
