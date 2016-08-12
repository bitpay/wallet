'use strict';

// DO NOT INCLUDE STORAGE HERE \/ \/
angular.module('copayApp.services').factory('walletService', function($log, $timeout, lodash, trezor, ledger, storageService, configService, uxLanguage) {
  // DO NOT INCLUDE STORAGE HERE ^^

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

  root.needsBackup = function(client) {
    if (client.isPrivKeyExternal()) return false;
    if (!client.credentials.mnemonic) return false;
    if (client.credentials.network == 'testnet') return false;

    return true;
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
    $log.warn('Client ERROR: ', err);

    $log.warn('TODO');
    return ; // TODO!!!
    if (err instanceof errors.NOT_AUTHORIZED) {
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

  // emits
  //  statusUpdated  walletId,  err ,statusObj
  //
  root.updateStatus = function(client, opts, cb,  initStatusHash, tries) {
    tries = tries || 0;
    opts = opts || {};

    var walletId = client.credentials.walletId

    if (opts.untilItChanges && lodash.isUndefined(initStatusHash)) {
      initStatusHash = _walletStatusHash();
      $log.debug('Updating status until it changes. initStatusHash:' + initStatusHash)
    }

    var get = function(cb) {
      if (opts.walletStatus)
        return cb(null, opts.walletStatus);
      else {
        return client.getStatus({
          twoStep: true
        }, function(err, ret) {
          if (err)
            return cb(bwcError.msg(err, gettext('Could not update Wallet')));
          // TODO??
          //          self.isSingleAddress = !!ret.wallet.singleAddress;
          //              self.updating = ret.wallet.scanStatus == 'running';
          return cb(err);
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

      $log.debug('Updating Status:', client.credentials.walletName, tries);
      get(function(err, walletStatus) {
        var currentStatusHash = _walletStatusHash(walletStatus);
        $log.debug('Status update. hash:' + currentStatusHash + ' Try:' + tries);
        if (!err && opts.untilItChanges && initStatusHash == currentStatusHash && tries < 7 && walletId == profileService.focusedClient.credentials.walletId) {
          return $timeout(function() {
            $log.debug('Retrying update... ' + walletId + ' Try:' + tries)
            return root.updateStatus(client, {
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

        $log.debug('Wallet Status:' + client.credentials.walletName, walletStatus);

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
        return cb(null, walletStatus);
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

  var getTxsFromServer = function(client, skip, endingTxid, limit, cb) {
    var res = [];

    client.getTxHistory({
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


  var updateLocalTxHistory = function(client, cb) {
    var FIRST_LIMIT = 5;
    var LIMIT = 50;
    var requestLimit = FIRST_LIMIT;
    var walletId = client.credentials.walletId;
    var config = configService.getSync().wallet.settings;

    var fixTxsUnit = function(txs) {
      if (!txs || !txs[0] || !txs[0].amountStr) return;

      var cacheUnit = txs[0].amountStr.split(' ')[1];

      if (cacheUnit == config.unitName)
        return;

      var name = ' ' + config.unitName;

      $log.debug('Fixing Tx Cache Unit to:' + name)
      lodash.each(txs, function(tx) {

        tx.amountStr = profileService.formatAmount(tx.amount) + name;
        tx.feeStr = profileService.formatAmount(tx.fees) + name;
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
        getTxsFromServer(client, skip, endingTxid, requestLimit, function(err, res, shouldContinue) {
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
          client.getTxNotes({
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


  root.updateHistory = function(client) {
    var walletId = client.credentials.walletId;

    if (!client.isComplete()) return;


    $log.debug('Updating Transaction History');
    self.txHistoryError = false;
    self.updatingTxHistory = true;

    $timeout(function() {
      updateLocalTxHistory(client, function(err) {
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

    client.publishTxProposal({
      txp: txp
    }, function(err, publishedTx) {
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

  root.updateRemotePreferences = function(clients, prefs, cb) {
    prefs = prefs || {};

    if (!lodash.isArray(clients))
      clients = [clients];

    function updateRemotePreferencesFor(clients, prefs, cb) {
      var client = clients.shift();
      if (!client) return cb();
      $log.debug('Saving remote preferences', client.credentials.walletName, prefs);

      client.savePreferences(prefs, function(err) {
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

  root.recreate = function(client, cb) {
    ongoingProcess.set('recreating', true);
    client.recreateWallet(function(err) {
      self.notAuthorized = false;
      ongoingProcess.set('recreating', false);

      if (err) {
        self.handleError(err);
        $rootScope.$apply();
        return;
      }

      profileService.bindWalletClient(client, {
        force: true
      });
      self.startScan(client);
    });
  };

  root.startScan = function(client) {
    $log.debug('Scanning wallet ' + client.credentials.walletId);
    if (!client.isComplete()) return;

//      self.updating = true;

    client.startScan({
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



  return root;
});
