'use strict';

// DO NOT INCLUDE STORAGE HERE \/ \/
angular.module('copayApp.services').factory('walletService', function($log, $timeout, lodash, trezor, ledger, storageService, configService, rateService, uxLanguage, bwcService, $filter, gettextCatalog, bwcError) {
  // DO NOT INCLUDE STORAGE HERE ^^
  //
  //
  // `wallet` is a decorated version of client.

  var root = {};


    // // RECEIVE
    // // Check address
    // root.isUsed(wallet.walletId, balance.byAddress, function(err, used) {
    //   if (used) {
    //     $log.debug('Address used. Creating new');
    //     $rootScope.$emit('Local/AddressIsUsed');
    //   }
    // });
    //

  root.Utils = bwcService.getUtils();
  root.formatAmount = function(amount, fullPrecision) {
    var config = configService.getSync().wallet.settings;
    if (config.unitCode == 'sat') return amount;

    //TODO : now only works for english, specify opts to change thousand separator and decimal separator
    var opts = {
      fullPrecision: !!fullPrecision
    };
    return this.Utils.formatAmount(amount, config.unitCode, opts);
  };


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

    if (!walletService.requiresBackup(wallet))
      return cb(false);

    storageService.getBackupFlag(wallet.credentials.walletId, function(err, val) {
      if (err) $log.error(err);
      if (val) return cb(false);
      return cb(true);
    });
  };

  var _walletStatusHash = function(walletStatus) {
    var bal;
    if (walletStatus) {
      bal = walletStatus.balance.totalAmount;
    } else {
      bal = self.totalBalanceSat;
    }
    return bal;
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
      self.notAuthorized = true;
      go.walletHome();
    } else if (err instanceof errors.NOT_FOUND) {
      self.showErrorPopup(gettext('Could not access Wallet Service: Not found'));
    } else {
      var msg = ""
      $scope.$emit('Local/ClientError', (err.error ? err.error : err));
      var msg = bwcError.msg(err, gettext('Error at Wallet Service'));
      self.showErrorPopup(msg);
    }
  };
  root.handleError = lodash.debounce(_handleError, 1000);


  root.setBalance = function(wallet, balance) {
    if (!balance) return;

    var config = configService.getSync().wallet.settings;
    var COIN = 1e8;

    // Address with Balance
    wallet.balanceByAddress = balance.byAddress;

    // Spend unconfirmed funds
    if (wallet.spendUnconfirmed) {
      wallet.totalBalanceSat = balance.totalAmount;
      wallet.lockedBalanceSat = balance.lockedAmount;
      wallet.availableBalanceSat = balance.availableAmount;
      wallet.totalBytesToSendMax = balance.totalBytesToSendMax;
      wallet.pendingAmount = null;
    } else {
      wallet.totalBalanceSat = balance.totalConfirmedAmount;
      wallet.lockedBalanceSat = balance.lockedConfirmedAmount;
      wallet.availableBalanceSat = balance.availableConfirmedAmount;
      wallet.totalBytesToSendMax = balance.totalBytesToSendConfirmedMax;
      wallet.pendingAmount = balance.totalAmount - balance.totalConfirmedAmount;
    }

    // Selected unit
    wallet.unitToSatoshi = config.unitToSatoshi;
    wallet.satToUnit = 1 / wallet.unitToSatoshi;
    wallet.unitName = config.unitName;

    //STR
    wallet.totalBalanceStr = root.formatAmount(wallet.totalBalanceSat) + ' ' + wallet.unitName;
    wallet.lockedBalanceStr = root.formatAmount(wallet.lockedBalanceSat) + ' ' + wallet.unitName;
    wallet.availableBalanceStr = root.formatAmount(wallet.availableBalanceSat) + ' ' + wallet.unitName;

    if (wallet.pendingAmount) {
      wallet.pendingAmountStr = root.formatAmount(wallet.pendingAmount) + ' ' + wallet.unitName;
    } else {
      wallet.pendingAmountStr = null;
    }

    wallet.alternativeName = config.alternativeName;
    wallet.alternativeIsoCode = config.alternativeIsoCode;

    rateService.whenAvailable(function() {

      var totalBalanceAlternative = rateService.toFiat(wallet.totalBalanceSat, wallet.alternativeIsoCode);
      var lockedBalanceAlternative = rateService.toFiat(wallet.lockedBalanceSat, wallet.alternativeIsoCode);
      var alternativeConversionRate = rateService.toFiat(100000000, wallet.alternativeIsoCode);

      wallet.totalBalanceAlternative = $filter('formatFiatAmount')(totalBalanceAlternative);
      wallet.lockedBalanceAlternative = $filter('formatFiatAmount')(lockedBalanceAlternative);
      wallet.alternativeConversionRate = $filter('formatFiatAmount')(alternativeConversionRate);

      wallet.alternativeBalanceAvailable = true;
      wallet.isRateAvailable = true;
    });
  };

  root.setStatus = function(wallet, status) {

    wallet.status = status;
    wallet.statusUpdatedOn = Date.now();
    wallet.isValid = true;
    root.setBalance(wallet, status.balance);

  };

  root.updateStatus = function(wallet, opts, cb, initStatusHash, tries) {
    tries = tries || 0;
    opts = opts || {};

    if (wallet.isValid && ! opts.force) 
      return;


    var walletId = wallet.id;

    if (opts.untilItChanges && lodash.isUndefined(initStatusHash)) {
      initStatusHash = _walletStatusHash();
      $log.debug('Updating status until it changes. initStatusHash:' + initStatusHash)
    }

    var get = function(cb) {
      if (opts.walletStatus)
        return cb(null, opts.walletStatus);
      else {
        return wallet.getStatus({
          twoStep: true
        }, function(err, ret) {
          if (err)
            return cb(bwcError.msg(err, gettext('Could not update Wallet')));
          // TODO??
          //          self.isSingleAddress = !!ret.wallet.singleAddress;
          //              self.updating = ret.wallet.scanStatus == 'running';
          return cb(null, ret);
        });
      }
    };

    // If not untilItChanges...trigger history update now
    if (opts.triggerTxUpdate && !opts.untilItChanges) {
      $timeout(function() {
        root.debounceUpdateHistory();
      }, 1);
    }

    $timeout(function() {

      // if (!opts.quiet)
      // self.updating = true;

      $log.debug('Updating Status:', wallet.credentials.walletName, tries);
      get(function(err, walletStatus) {
        var currentStatusHash = _walletStatusHash(walletStatus);
        $log.debug('Status update. hash:' + currentStatusHash + ' Try:' + tries);
        if (!err && opts.untilItChanges && initStatusHash == currentStatusHash && tries < 7 && walletId == profileService.focusedClient.credentials.walletId) {
          return $timeout(function() {
            $log.debug('Retrying update... ' + walletId + ' Try:' + tries)
            return root.updateStatus(wallet, {
              walletStatus: null,
              untilItChanges: true,
              triggerTxUpdate: opts.triggerTxUpdate,
            }, cb, initStatusHash, ++tries);
          }, 1400 * tries);
        }

        if (err) {
          root.handleError(err);
          return cb(err);
        }
        $log.debug('Got Wallet Status for:' + wallet.credentials.walletName);

        root.setStatus(wallet, walletStatus);

        // self.setPendingTxps(walletStatus.pendingTxps);
        //
        // // Status Shortcuts
        // self.lastUpdate = Date.now();
        // self.walletName = walletStatus.wallet.name;
        // self.walletSecret = walletStatus.wallet.secret;
        // self.walletStatus = walletStatus.wallet.status;
        // self.walletScanStatus = walletStatus.wallet.scanStatus;
        // self.copayers = walletStatus.wallet.copayers;
        // self.preferences = walletStatus.preferences;
        // self.setBalance(walletStatus.balance);
        // self.otherWallets = lodash.filter(profileService.getWallets(self.network), function(w) {
        //   return w.id != self.walletId;
        // });
        //
        // Notify external addons or plugins

        // TODO
        if (opts.triggerTxUpdate && opts.untilItChanges) {
          $timeout(function() {
            root.debounceUpdateHistory();
          }, 1);
        }
        return cb();
        // } else {
        //   self.loadingWallet = false;
        // }
      });
    });
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


  var updateLocalTxHistory = function(wallet, cb) {
    var FIRST_LIMIT = 5;
    var LIMIT = 50;
    var requestLimit = FIRST_LIMIT;
    var walletId = wallet.credentials.walletId;
    var config = configService.getSync().wallet.settings;

    var fixTxsUnit = function(txs) {
      if (!txs || !txs[0] || !txs[0].amountStr) return;

      var cacheUnit = txs[0].amountStr.split(' ')[1];

      if (cacheUnit == config.unitName)
        return;

      var name = ' ' + config.unitName;

      $log.debug('Fixing Tx Cache Unit to:' + name)
      lodash.each(txs, function(tx) {

        tx.amountStr = root.formatAmount(tx.amount) + name;
        tx.feeStr = root.formatAmount(tx.fees) + name;
      });
    };

    getSavedTxs(walletId, function(err, txsFromLocal) {
      if (err) return cb(err);

      fixTxsUnit(txsFromLocal);

      var confirmedTxs = self.removeAndMarkSoftConfirmedTx(txsFromLocal);
      var endingTxid = confirmedTxs[0] ? confirmedTxs[0].txid : null;
      var endingTs = confirmedTxs[0] ? confirmedTxs[0].time : null;


      // First update
      if (walletId == profileService.focusedClient.credentials.walletId) {
        self.completeHistory = txsFromLocal;
        setCompactTxHistory();
      }

      if (historyUpdateInProgress[walletId])
        return;

      historyUpdateInProgress[walletId] = true;

      function getNewTxs(newTxs, skip, i_cb) {
        getTxsFromServer(wallet, skip, endingTxid, requestLimit, function(err, res, shouldContinue) {
          if (err) return i_cb(err);

          newTxs = newTxs.concat(lodash.compact(res));
          skip = skip + requestLimit;

          $log.debug('Syncing TXs. Got:' + newTxs.length + ' Skip:' + skip, ' EndingTxid:', endingTxid, ' Continue:', shouldContinue);

          if (!shouldContinue) {
            newTxs = self.processNewTxs(newTxs);
            $log.debug('Finished Sync: New / soft confirmed Txs: ' + newTxs.length);
            return i_cb(null, newTxs);
          }

          requestLimit = LIMIT;
          getNewTxs(newTxs, skip, i_cb);

          // Progress update
          if (walletId == profileService.focusedClient.credentials.walletId) {
            self.txProgress = newTxs.length;
            if (self.completeHistory < FIRST_LIMIT && txsFromLocal.length == 0) {
              $log.debug('Showing partial history');
              var newHistory = self.processNewTxs(newTxs);
              newHistory = lodash.compact(newHistory.concat(confirmedTxs));
              self.completeHistory = newHistory;
              setCompactTxHistory();
            }
            $timeout(function() {
              $rootScope.$apply();
            });
          }
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
          if (walletId == profileService.focusedClient.credentials.walletId) {
            self.completeHistory = newHistory;
            setCompactTxHistory();
          }

          return storageService.setTxHistory(historyToSave, walletId, function() {
            $log.debug('Tx History saved.');

            return cb();
          });
        });
      });
    });
  };


  root.updateHistory = function(wallet) {
    var walletId = wallet.credentials.walletId;

    if (!wallet.isComplete()) return;


    $log.debug('Updating Transaction History');
    self.txHistoryError = false;
    self.updatingTxHistory = true;

    $timeout(function() {
      updateLocalTxHistory(wallet, function(err) {
        historyUpdateInProgress[walletId] = self.updatingTxHistory = false;
        self.loadingWallet = false;
        self.txProgress = 0;
        if (err)
          self.txHistoryError = true;

        $timeout(function() {
          self.newTx = false
        }, 1000);

        $rootScope.$apply();
      });
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

  var setCompactTxHistory = function() {

    // TODO
    self.isSearching = false;
    self.nextTxHistory = self.historyShowMoreLimit;
    self.txHistory = self.completeHistory ? self.completeHistory.slice(0, self.historyShowLimit) : null;
    self.historyShowMore = self.completeHistory ? self.completeHistory.length > self.historyShowLimit : null;
  };

  root.debounceUpdateHistory = lodash.debounce(function() {
    root.updateHistory();
  }, 1000);

  self.throttledUpdateHistory = lodash.throttle(function() {
    root.updateHistory();
  }, 5000);

  self.showErrorPopup = function(msg, cb) {
    $log.warn('Showing err popup:' + msg);

    function openErrorPopup(msg, cb) {
      $scope.msg = msg;

      self.errorPopup = $ionicPopup.show({
        templateUrl: 'views/includes/alert.html',
        scope: $scope,
      });

      $scope.close = function() {
        return cb();
      };
    }

    openErrorPopup(msg, function() {
      self.errorPopup.close();
      if (cb) return cb();
    });
  };

  root.recreate = function(wallet, cb) {
    ongoingProcess.set('recreating', true);
    wallet.recreateWallet(function(err) {
      self.notAuthorized = false;
      ongoingProcess.set('recreating', false);

      if (err) {
        self.handleError(err);
        $rootScope.$apply();
        return;
      }

      profileService.bindWalletClient(wallet, {
        force: true
      });
      self.startScan(wallet);
    });
  };

  root.startScan = function(wallet) {
    $log.debug('Scanning wallet ' + wallet.credentials.walletId);
    if (!wallet.isComplete()) return;

    //      self.updating = true;

    wallet.startScan({
      includeCopayerBranches: true,
    }, function(err) {

      // TODO
      // if (err && self.walletId == walletId) {
      //   self.updating = false;
      //   self.handleError(err);
      //   $rootScope.$apply();
      // }
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
console.log('[walletService.js.786:wallet:]',wallet, forceNew); //TODO

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



  root.handleEncryptedWallet = function(client, cb) {
    if (!root.isEncrypted(client)) return cb();
    $rootScope.$emit('Local/NeedsPassword', false, function(err, password) {
      if (err) return cb(err);
      return cb(walletService.unlock(client, password));
    });
  };


  return root;
});
