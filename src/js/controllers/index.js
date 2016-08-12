'use strict';

angular.module('copayApp.controllers').controller('indexController', function($rootScope, $scope, $log, $filter, $timeout, $ionicScrollDelegate, $ionicPopup, $ionicSideMenuDelegate, $httpBackend, latestReleaseService, feeService, bwcService, pushNotificationsService, lodash, go, profileService, configService, rateService, storageService, addressService, gettext, gettextCatalog, amMoment, addonManager, bwcError, txFormatService, uxLanguage, glideraService, coinbaseService, platformInfo, addressbookService, openURLService, ongoingProcess) {

  var self = this;
  var SOFT_CONFIRMATION_LIMIT = 12;
  var errors = bwcService.getErrors();
  var historyUpdateInProgress = {};
  var isChromeApp = platformInfo.isChromeApp;
  var isCordova = platformInfo.isCordova;
  var isNW = platformInfo.isNW;

  var ret = {};
  ret.isCordova = isCordova;
  ret.isChromeApp = isChromeApp;
  ret.isSafari = platformInfo.isSafari;
  ret.isWindowsPhoneApp = platformInfo.isWP;
  ret.historyShowLimit = 10;
  ret.historyShowMoreLimit = 10;
  ret.isSearching = false;
  ret.prevState = 'walletHome';
  ret.physicalScreenWidth = ((window.innerWidth > 0) ? window.innerWidth : screen.width);

  ret.appConfig = window.appConfig;

  // Only for testing
  //storageService.checkQuota();

  ret.menu = [{
    'title': gettext('Receive'),
    'icon': {
      false: 'icon-receive',
      true: 'icon-receive-active'
    },
    'link': 'receive'
  }, {
    'title': gettext('Activity'),
    'icon': {
      false: 'icon-activity',
      true: 'icon-activity-active'
    },
    'link': 'walletHome'
  }, {
    'title': gettext('Send'),
    'icon': {
      false: 'icon-send',
      true: 'icon-send-active'
    },
    'link': 'send'
  }];

  ret.addonViews = addonManager.addonViews();
  ret.txTemplateUrl = addonManager.txTemplateUrl() || 'views/includes/transaction.html';

  ret.tab = 'walletHome';
  var vanillaScope = ret;

  if (isNW) {
    latestReleaseService.checkLatestRelease(function(err, newRelease) {
      if (err) {
        $log.warn(err);
        return;
      }

      if (newRelease)
        $scope.newRelease = gettext('There is a new version of Copay. Please update');
    });
  }

  function strip(number) {
    return (parseFloat(number.toPrecision(12)));
  };

  self.goHome = function() {
    go.walletHome();
  };

  self.allowRefresher = function() {
    if ($ionicSideMenuDelegate.getOpenRatio() != 0) self.allowPullToRefresh = false;
  }

  self.hideBalance = function() {
    storageService.getHideBalanceFlag(self.walletId, function(err, shouldHideBalance) {
      if (err) self.shouldHideBalance = false;
      else self.shouldHideBalance = (shouldHideBalance == 'true') ? true : false;
    });
  }

  self.onHold = function() {
    self.shouldHideBalance = !self.shouldHideBalance;
    storageService.setHideBalanceFlag(self.walletId, self.shouldHideBalance.toString(), function() {});
  }

  self.setWalletPreferencesTitle = function() {
    return gettext("Wallet Preferences");
  }

  self.cleanInstance = function() {
    $log.debug('Cleaning Index Instance');
    lodash.each(self, function(v, k) {
      if (lodash.isFunction(v)) return;
      // This are to prevent flicker in mobile:
      if (k == 'hasProfile') return;
      if (k == 'tab') return;
      if (k == 'noFocusedWallet') return;
      if (k == 'backgroundColor') return;
      if (k == 'physicalScreenWidth') return;
      if (k == 'loadingWallet') {
        self.loadingWallet = true;
        return;
      }
      if (!lodash.isUndefined(vanillaScope[k])) {
        self[k] = vanillaScope[k];
        return;
      }

      delete self[k];
    });
  };

  self.setFocusedWallet = function() {
    var fc = profileService.focusedClient;
    if (!fc) return;

    self.cleanInstance();
    self.loadingWallet = true;
    self.setSpendUnconfirmed();

    $timeout(function() {
      $rootScope.$apply();

      self.hasProfile = true;
      self.isSingleAddress = false;
      self.noFocusedWallet = false;
      self.updating = false;

      // Credentials Shortcuts
      self.m = fc.credentials.m;
      self.n = fc.credentials.n;
      self.network = fc.credentials.network;
      self.copayerId = fc.credentials.copayerId;
      self.copayerName = fc.credentials.copayerName;
      self.requiresMultipleSignatures = fc.credentials.m > 1;
      self.isShared = fc.credentials.n > 1;
      self.walletName = fc.credentials.walletName;
      self.walletId = fc.credentials.walletId;
      self.isComplete = fc.isComplete();
      self.canSign = fc.canSign();
      self.isPrivKeyExternal = fc.isPrivKeyExternal();
      self.isPrivKeyEncrypted = fc.isPrivKeyEncrypted();
      self.externalSource = fc.getPrivKeyExternalSourceName();
      self.account = fc.credentials.account;
      self.incorrectDerivation = fc.keyDerivationOk === false;

      if (self.externalSource == 'trezor')
        self.account++;

      self.txps = [];
      self.copayers = [];
      self.updateColor();
      self.updateAlias();
      self.setAddressbook();

      self.initGlidera();
      self.initCoinbase();

      self.hideBalance();

      self.setCustomBWSFlag();

      if (!self.isComplete) {
        $log.debug('Wallet not complete BEFORE update... redirecting');
        go.path('copayers');
      } else {
        if (go.is('copayers')) {
          $log.debug('Wallet Complete BEFORE update... redirect to home');
          go.walletHome();
        }
      }

      profileService.needsBackup(fc, function(needsBackup) {
        self.needsBackup = needsBackup;
        self.openWallet(function() {
          if (!self.isComplete) {
            $log.debug('Wallet not complete after update... redirecting');
            go.path('copayers');
          } else {
            if (go.is('copayers')) {
              $log.debug('Wallet Complete after update... redirect to home');
              go.walletHome();
            }
          }
        });
      });
    });
  };

  self.setCustomBWSFlag = function() {
    var defaults = configService.getDefaults();
    var config = configService.getSync();

    self.usingCustomBWS = config.bwsFor && config.bwsFor[self.walletId] && (config.bwsFor[self.walletId] != defaults.bws.url);
  };


  self.setTab = function(tab, reset, tries, switchState) {
    tries = tries || 0;

    // check if the whole menu item passed
    if (typeof tab == 'object') {
      if (tab.open) {
        if (tab.link) {
          self.tab = tab.link;
        }
        tab.open();
        return;
      } else {
        return self.setTab(tab.link, reset, tries, switchState);
      }
    }
    if (self.tab === tab && !reset)
      return;

    if (!document.getElementById('menu-' + tab) && ++tries < 5) {
      return $timeout(function() {
        self.setTab(tab, reset, tries, switchState);
      }, 300);
    }

    if (!self.tab || !go.is('walletHome'))
      self.tab = 'walletHome';

    var changeTab = function() {
      if (document.getElementById(self.tab)) {
        document.getElementById(self.tab).className = 'tab-out tab-view ' + self.tab;
        var old = document.getElementById('menu-' + self.tab);
        if (old) {
          old.className = '';
        }
      }

      if (document.getElementById(tab)) {
        document.getElementById(tab).className = 'tab-in  tab-view ' + tab;
        var newe = document.getElementById('menu-' + tab);
        if (newe) {
          newe.className = 'active';
        }
      }

      self.tab = tab;
      $rootScope.$emit('Local/TabChanged', tab);
    };

    if (switchState && !go.is('walletHome')) {
      go.path('walletHome', function() {
        changeTab();
      });
      return;
    }

    changeTab();
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

  // TODO move this to wallet service
  self.updateAll = function(opts, initStatusHash, tries) {
    $scope.$broadcast('scroll.refreshComplete');
    tries = tries || 0;
    opts = opts || {};
    var fc = profileService.focusedClient;
    if (!fc) return;

    var walletId = fc.credentials.walletId

    if (opts.untilItChanges && lodash.isUndefined(initStatusHash)) {
      initStatusHash = _walletStatusHash();
      $log.debug('Updating status until it changes. initStatusHash:' + initStatusHash)
    }

    var get = function(cb) {
      if (opts.walletStatus)
        return cb(null, opts.walletStatus);
      else {
        self.updateError = false;
        return fc.getStatus({
          twoStep: true
        }, function(err, ret) {
          if (err) {
            self.updateError = bwcError.msg(err, gettext('Could not update Wallet'));
          } else {
            self.isSingleAddress = !!ret.wallet.singleAddress;
            if (!opts.quiet)
              self.updating = ret.wallet.scanStatus == 'running';
          }
          return cb(err, ret);
        });
      }
    };

    // If not untilItChanges...trigger history update now
    if (opts.triggerTxUpdate && !opts.untilItChanges) {
      $timeout(function() {
        self.debounceUpdateHistory();
      }, 1);
    }

    $timeout(function() {

      if (!opts.quiet)
        self.updating = true;

      $log.debug('Updating Status:', fc.credentials.walletName, tries);
      get(function(err, walletStatus) {
        var currentStatusHash = _walletStatusHash(walletStatus);
        $log.debug('Status update. hash:' + currentStatusHash + ' Try:' + tries);
        if (!err && opts.untilItChanges && initStatusHash == currentStatusHash && tries < 7 && walletId == profileService.focusedClient.credentials.walletId) {
          return $timeout(function() {
            $log.debug('Retrying update... Try:' + tries)
            return self.updateAll({
              walletStatus: null,
              untilItChanges: true,
              triggerTxUpdate: opts.triggerTxUpdate,
            }, initStatusHash, ++tries);
          }, 1400 * tries);
        }

        if (walletId != profileService.focusedClient.credentials.walletId)
          return;

        self.updating = false;

        if (err) {
          self.handleError(err);
          return;
        }
        $log.debug('Wallet Status:', walletStatus);
        self.setPendingTxps(walletStatus.pendingTxps);

        // Status Shortcuts
        self.lastUpdate = Date.now();
        self.walletName = walletStatus.wallet.name;
        self.walletSecret = walletStatus.wallet.secret;
        self.walletStatus = walletStatus.wallet.status;
        self.walletScanStatus = walletStatus.wallet.scanStatus;
        self.copayers = walletStatus.wallet.copayers;
        self.preferences = walletStatus.preferences;
        self.setBalance(walletStatus.balance);
        self.otherWallets = lodash.filter(profileService.getWallets(self.network), function(w) {
          return w.id != self.walletId;
        });

        // Notify external addons or plugins
        $rootScope.$emit('Local/BalanceUpdated', walletStatus.balance);
        $rootScope.$apply();


        if (opts.triggerTxUpdate && opts.untilItChanges) {
          $timeout(function() {
            self.debounceUpdateHistory();
          }, 1);
        } else {
          self.loadingWallet = false;
        }

        if (opts.cb) return opts.cb();
      });
    });
  };

  self.setSpendUnconfirmed = function(spendUnconfirmed) {
    self.spendUnconfirmed = spendUnconfirmed || configService.getSync().wallet.spendUnconfirmed;
  };

  self.updateBalance = function() {
    var fc = profileService.focusedClient;
    $timeout(function() {
      ongoingProcess.set('updatingBalance', true);
      $log.debug('Updating Balance');
      fc.getBalance(function(err, balance) {
        ongoingProcess.set('updatingBalance', false);
        if (err) {
          self.handleError(err);
          return;
        }
        $log.debug('Wallet Balance:', balance);
        self.setBalance(balance);
      });
    });
  };

  self.updatePendingTxps = function() {
    var fc = profileService.focusedClient;
    $timeout(function() {
      self.updating = true;
      $log.debug('Updating PendingTxps');
      fc.getTxProposals({}, function(err, txps) {
        self.updating = false;
        if (err) {
          self.handleError(err);
        } else {
          $log.debug('Wallet PendingTxps:', txps);
          self.setPendingTxps(txps);
        }
        $rootScope.$apply();
      });
    });
  };

  // This handles errors from BWS/index which normally
  // trigger from async events (like updates).
  // Debounce function avoids multiple popups
  var _handleError = function(err) {
    $log.warn('Client ERROR: ', err);
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

  self.handleError = lodash.debounce(_handleError, 1000);

  self.openWallet = function(cb) {
    var fc = profileService.focusedClient;
    $timeout(function() {
      $rootScope.$apply();
      self.updating = true;
      self.updateError = false;
      fc.openWallet(function(err, walletStatus) {
        self.updating = false;
        if (err) {
          self.updateError = true;
          self.handleError(err);
          return;
        }
        $log.debug('Wallet Opened');

        self.updateAll(lodash.isObject(walletStatus) ? {
          walletStatus: walletStatus,
          cb: cb,
        } : {
          cb: cb
        });
        $rootScope.$apply();
      });
    });
  };

  self.setPendingTxps = function(txps) {
    self.pendingTxProposalsCountForUs = 0;
    var now = Math.floor(Date.now() / 1000);

    /* Uncomment to test multiple outputs */
    /*
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

      tx = txFormatService.processTx(tx);

      // no future transactions...
      if (tx.createdOn > now)
        tx.createdOn = now;

      var action = lodash.find(tx.actions, {
        copayerId: self.copayerId
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

      if (tx.creatorId != self.copayerId) {
        self.pendingTxProposalsCountForUs = self.pendingTxProposalsCountForUs + 1;
      }
      addonManager.formatPendingTxp(tx);
    });
    self.txps = txps;
  };

  var SAFE_CONFIRMATIONS = 6;

  self.processNewTxs = function(txs) {
    var config = configService.getSync().wallet.settings;
    var now = Math.floor(Date.now() / 1000);
    var txHistoryUnique = {};
    var ret = [];
    self.hasUnsafeConfirmed = false;

    lodash.each(txs, function(tx) {
      tx = txFormatService.processTx(tx);

      // no future transactions...
      if (tx.time > now)
        tx.time = now;

      if (tx.confirmations >= SAFE_CONFIRMATIONS) {
        tx.safeConfirmed = SAFE_CONFIRMATIONS + '+';
      } else {
        tx.safeConfirmed = false;
        self.hasUnsafeConfirmed = true;
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

  self.updateAlias = function() {
    var config = configService.getSync();
    config.aliasFor = config.aliasFor || {};
    self.alias = config.aliasFor[self.walletId];
    var fc = profileService.focusedClient;
    fc.alias = self.alias;
  };

  self.updateColor = function() {
    var config = configService.getSync();
    config.colorFor = config.colorFor || {};
    self.backgroundColor = config.colorFor[self.walletId] || '#4A90E2';
    var fc = profileService.focusedClient;
    fc.backgroundColor = self.backgroundColor;
    if (isCordova && StatusBar.isVisible) {
      StatusBar.backgroundColorByHexString(fc.backgroundColor);
    }
  };

  self.setBalance = function(balance) {
    if (!balance) return;
    var config = configService.getSync().wallet.settings;
    var COIN = 1e8;


    // Address with Balance
    self.balanceByAddress = balance.byAddress;

    // Spend unconfirmed funds
    if (self.spendUnconfirmed) {
      self.totalBalanceSat = balance.totalAmount;
      self.lockedBalanceSat = balance.lockedAmount;
      self.availableBalanceSat = balance.availableAmount;
      self.totalBytesToSendMax = balance.totalBytesToSendMax;
      self.pendingAmount = null;
    } else {
      self.totalBalanceSat = balance.totalConfirmedAmount;
      self.lockedBalanceSat = balance.lockedConfirmedAmount;
      self.availableBalanceSat = balance.availableConfirmedAmount;
      self.totalBytesToSendMax = balance.totalBytesToSendConfirmedMax;
      self.pendingAmount = balance.totalAmount - balance.totalConfirmedAmount;
    }

    // Selected unit
    self.unitToSatoshi = config.unitToSatoshi;
    self.satToUnit = 1 / self.unitToSatoshi;
    self.unitName = config.unitName;

    //STR
    self.totalBalanceStr = profileService.formatAmount(self.totalBalanceSat) + ' ' + self.unitName;
    self.lockedBalanceStr = profileService.formatAmount(self.lockedBalanceSat) + ' ' + self.unitName;
    self.availableBalanceStr = profileService.formatAmount(self.availableBalanceSat) + ' ' + self.unitName;

    if (self.pendingAmount) {
      self.pendingAmountStr = profileService.formatAmount(self.pendingAmount) + ' ' + self.unitName;
    } else {
      self.pendingAmountStr = null;
    }

    self.alternativeName = config.alternativeName;
    self.alternativeIsoCode = config.alternativeIsoCode;

    // Check address
    addressService.isUsed(self.walletId, balance.byAddress, function(err, used) {
      if (used) {
        $log.debug('Address used. Creating new');
        $rootScope.$emit('Local/AddressIsUsed');
      }
    });

    rateService.whenAvailable(function() {

      var totalBalanceAlternative = rateService.toFiat(self.totalBalanceSat, self.alternativeIsoCode);
      var lockedBalanceAlternative = rateService.toFiat(self.lockedBalanceSat, self.alternativeIsoCode);
      var alternativeConversionRate = rateService.toFiat(100000000, self.alternativeIsoCode);

      self.totalBalanceAlternative = $filter('formatFiatAmount')(totalBalanceAlternative);
      self.lockedBalanceAlternative = $filter('formatFiatAmount')(lockedBalanceAlternative);
      self.alternativeConversionRate = $filter('formatFiatAmount')(alternativeConversionRate);

      self.alternativeBalanceAvailable = true;

      self.isRateAvailable = true;
      $rootScope.$apply();
    });

    if (!rateService.isAvailable()) {
      $rootScope.$apply();
    }
  };

  self.removeAndMarkSoftConfirmedTx = function(txs) {
    return lodash.filter(txs, function(tx) {
      if (tx.confirmations >= SOFT_CONFIRMATION_LIMIT)
        return tx;
      tx.recent = true;
    });
  }

  self.getSavedTxs = function(walletId, cb) {

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
  }

  self.updateLocalTxHistory = function(client, cb) {
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

    self.getSavedTxs(walletId, function(err, txsFromLocal) {
      if (err) return cb(err);

      fixTxsUnit(txsFromLocal);

      var confirmedTxs = self.removeAndMarkSoftConfirmedTx(txsFromLocal);
      var endingTxid = confirmedTxs[0] ? confirmedTxs[0].txid : null;
      var endingTs = confirmedTxs[0] ? confirmedTxs[0].time : null;


      // First update
      if (walletId == profileService.focusedClient.credentials.walletId) {
        self.completeHistory = txsFromLocal;
        self.setCompactTxHistory();
      }

      if (historyUpdateInProgress[walletId])
        return;

      historyUpdateInProgress[walletId] = true;

      function getNewTxs(newTxs, skip, i_cb) {
        self.getTxsFromServer(client, skip, endingTxid, requestLimit, function(err, res, shouldContinue) {
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
              self.setCompactTxHistory();
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
            self.setCompactTxHistory();
          }

          return storageService.setTxHistory(historyToSave, walletId, function() {
            $log.debug('Tx History saved.');

            return cb();
          });
        });
      });
    });
  }

  self.showMore = function() {
    $timeout(function() {
      if (self.isSearching) {
        self.txHistorySearchResults = self.result.slice(0, self.nextTxHistory);
        $log.debug('Total txs: ', self.txHistorySearchResults.length + '/' + self.result.length);
        if (self.txHistorySearchResults.length >= self.result.length)
          self.historyShowMore = false;
      } else {
        self.txHistory = self.completeHistory.slice(0, self.nextTxHistory);
        $log.debug('Total txs: ', self.txHistory.length + '/' + self.completeHistory.length);
        if (self.txHistory.length >= self.completeHistory.length)
          self.historyShowMore = false;
      }
      self.nextTxHistory += self.historyShowMoreLimit;
      $scope.$broadcast('scroll.infiniteScrollComplete');
    }, 100);
  };

  self.startSearch = function() {
    self.isSearching = true;
    self.txHistorySearchResults = [];
    self.result = [];
    self.historyShowMore = false;
    self.nextTxHistory = self.historyShowMoreLimit;
  }

  self.cancelSearch = function() {
    self.isSearching = false;
    self.result = [];
    self.setCompactTxHistory();
  }

  self.updateSearchInput = function(search) {
    self.search = search;
    if (isCordova)
      window.plugins.toast.hide();
    self.throttleSearch();
    $ionicScrollDelegate.resize();
  }

  self.throttleSearch = lodash.throttle(function() {

    function filter(search) {
      self.result = [];

      function computeSearchableString(tx) {
        var addrbook = '';
        if (tx.addressTo && self.addressbook && self.addressbook[tx.addressTo]) addrbook = self.addressbook[tx.addressTo] || '';
        var searchableDate = computeSearchableDate(new Date(tx.time * 1000));
        var message = tx.message ? tx.message : '';
        var comment = tx.note ? tx.note.body : '';
        var addressTo = tx.addressTo ? tx.addressTo : '';
        return ((tx.amountStr + message + addressTo + addrbook + searchableDate + comment).toString()).toLowerCase();
      }

      function computeSearchableDate(date) {
        var day = ('0' + date.getDate()).slice(-2).toString();
        var month = ('0' + (date.getMonth() + 1)).slice(-2).toString();
        var year = date.getFullYear();
        return [month, day, year].join('/');
      };

      if (lodash.isEmpty(search)) {
        self.historyShowMore = false;
        return [];
      }
      self.result = lodash.filter(self.completeHistory, function(tx) {
        if (!tx.searcheableString) tx.searcheableString = computeSearchableString(tx);
        return lodash.includes(tx.searcheableString, search.toLowerCase());
      });

      if (self.result.length > self.historyShowLimit) self.historyShowMore = true;
      else self.historyShowMore = false;

      return self.result;
    };

    self.txHistorySearchResults = filter(self.search).slice(0, self.historyShowLimit);
    if (isCordova)
      window.plugins.toast.showShortBottom(gettextCatalog.getString('Matches: ' + self.result.length));

    $timeout(function() {
      $rootScope.$apply();
    });

  }, 1000);

  self.getTxsFromServer = function(client, skip, endingTxid, limit, cb) {
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

  self.updateHistory = function() {
    var fc = profileService.focusedClient;
    if (!fc) return;
    var walletId = fc.credentials.walletId;

    if (!fc.isComplete()) {
      return;
    }

    $log.debug('Updating Transaction History');
    self.txHistoryError = false;
    self.updatingTxHistory = true;

    $timeout(function() {
      self.updateLocalTxHistory(fc, function(err) {
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

  self.setCompactTxHistory = function() {
    self.isSearching = false;
    self.nextTxHistory = self.historyShowMoreLimit;
    self.txHistory = self.completeHistory ? self.completeHistory.slice(0, self.historyShowLimit) : null;
    self.historyShowMore = self.completeHistory ? self.completeHistory.length > self.historyShowLimit : null;
  };

  self.debounceUpdateHistory = lodash.debounce(function() {
    self.updateHistory();
  }, 1000);

  self.throttledUpdateHistory = lodash.throttle(function() {
    self.updateHistory();
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

  self.recreate = function(cb) {
    var fc = profileService.focusedClient;
    ongoingProcess.set('recreating', true);
    fc.recreateWallet(function(err) {
      self.notAuthorized = false;
      ongoingProcess.set('recreating', false);

      if (err) {
        self.handleError(err);
        $rootScope.$apply();
        return;
      }

      profileService.bindWalletClient(fc, {
        force: true
      });
      self.startScan(self.walletId);
    });
  };

  self.toggleLeftMenu = function() {
    profileService.isDisclaimerAccepted(function(val) {
      if (val) go.toggleLeftMenu();
      else
        $log.debug('Disclaimer not accepted, cannot open menu');
    });
  };

  self.retryScan = function() {
    var self = this;
    self.startScan(self.walletId);
  }

  self.startScan = function(walletId) {
    $log.debug('Scanning wallet ' + walletId);
    var c = profileService.walletClients[walletId];
    if (!c.isComplete()) return;

    if (self.walletId == walletId)
      self.updating = true;

    c.startScan({
      includeCopayerBranches: true,
    }, function(err) {
      if (err && self.walletId == walletId) {
        self.updating = false;
        self.handleError(err);
        $rootScope.$apply();
      }
    });
  };

  self.initGlidera = function(accessToken) {
    self.glideraEnabled = configService.getSync().glidera.enabled;
    self.glideraTestnet = configService.getSync().glidera.testnet;
    var network = self.glideraTestnet ? 'testnet' : 'livenet';

    self.glideraToken = null;
    self.glideraError = null;
    self.glideraPermissions = null;
    self.glideraEmail = null;
    self.glideraPersonalInfo = null;
    self.glideraTxs = null;
    self.glideraStatus = null;

    if (!self.glideraEnabled) return;

    glideraService.setCredentials(network);

    var getToken = function(cb) {
      if (accessToken) {
        cb(null, accessToken);
      } else {
        storageService.getGlideraToken(network, cb);
      }
    };

    getToken(function(err, accessToken) {
      if (err || !accessToken) return;
      else {
        glideraService.getAccessTokenPermissions(accessToken, function(err, p) {
          if (err) {
            self.glideraError = err;
          } else {
            self.glideraToken = accessToken;
            self.glideraPermissions = p;
            self.updateGlidera({
              fullUpdate: true
            });
          }
        });
      }
    });
  };

  self.updateGlidera = function(opts) {
    if (!self.glideraToken || !self.glideraPermissions) return;
    var accessToken = self.glideraToken;
    var permissions = self.glideraPermissions;

    opts = opts || {};

    glideraService.getStatus(accessToken, function(err, data) {
      self.glideraStatus = data;
    });

    glideraService.getLimits(accessToken, function(err, limits) {
      self.glideraLimits = limits;
    });

    if (permissions.transaction_history) {
      glideraService.getTransactions(accessToken, function(err, data) {
        self.glideraTxs = data;
      });
    }

    if (permissions.view_email_address && opts.fullUpdate) {
      glideraService.getEmail(accessToken, function(err, data) {
        self.glideraEmail = data.email;
      });
    }
    if (permissions.personal_info && opts.fullUpdate) {
      glideraService.getPersonalInfo(accessToken, function(err, data) {
        self.glideraPersonalInfo = data;
      });
    }

  };

  self.initCoinbase = function(accessToken) {
    self.coinbaseEnabled = configService.getSync().coinbase.enabled;
    self.coinbaseTestnet = configService.getSync().coinbase.testnet;
    var network = self.coinbaseTestnet ? 'testnet' : 'livenet';

    self.coinbaseToken = null;
    self.coinbaseError = null;
    self.coinbasePermissions = null;
    self.coinbaseEmail = null;
    self.coinbasePersonalInfo = null;
    self.coinbaseTxs = null;
    self.coinbaseStatus = null;

    if (!self.coinbaseEnabled) return;

    coinbaseService.setCredentials(network);

    var getToken = function(cb) {
      if (accessToken) {
        cb(null, accessToken);
      } else {
        storageService.getCoinbaseToken(network, cb);
      }
    };

    getToken(function(err, accessToken) {
      if (err || !accessToken) return;
      else {
        coinbaseService.getAccounts(accessToken, function(err, a) {
          if (err) {
            self.coinbaseError = err;
            if (err.errors[0] && err.errors[0].id == 'expired_token') {
              self.refreshCoinbaseToken();
            }
          } else {
            self.coinbaseToken = accessToken;
            lodash.each(a.data, function(account) {
              if (account.primary && account.type == 'wallet') {
                self.coinbaseAccount = account;
                self.updateCoinbase();
              }
            });
          }
        });
      }
    });
  };

  self.updateCoinbase = lodash.debounce(function(opts) {
    if (!self.coinbaseToken || !self.coinbaseAccount) return;
    var accessToken = self.coinbaseToken;
    var accountId = self.coinbaseAccount.id;

    opts = opts || {};

    if (opts.updateAccount) {
      coinbaseService.getAccount(accessToken, accountId, function(err, a) {
        if (err) {
          self.coinbaseError = err;
          if (err.errors[0] && err.errors[0].id == 'expired_token') {
            self.refreshCoinbaseToken();
          }
          return;
        }
        self.coinbaseAccount = a.data;
      });
    }

    coinbaseService.getCurrentUser(accessToken, function(err, u) {
      if (err) {
        self.coinbaseError = err;
        if (err.errors[0] && err.errors[0].id == 'expired_token') {
          self.refreshCoinbaseToken();
        }
        return;
      }
      self.coinbaseUser = u.data;
    });

    coinbaseService.getPendingTransactions(function(err, txs) {
      self.coinbasePendingTransactions = lodash.isEmpty(txs) ? null : txs;
      lodash.forEach(txs, function(dataFromStorage, txId) {
        if ((dataFromStorage.type == 'sell' && dataFromStorage.status == 'completed') ||
          (dataFromStorage.type == 'buy' && dataFromStorage.status == 'completed') ||
          dataFromStorage.status == 'error' ||
          (dataFromStorage.type == 'send' && dataFromStorage.status == 'completed')) return;
        coinbaseService.getTransaction(accessToken, accountId, txId, function(err, tx) {
          if (err) {
            if (err.errors[0] && err.errors[0].id == 'expired_token') {
              self.refreshCoinbaseToken();
              return;
            }
            coinbaseService.savePendingTransaction(dataFromStorage, {
              status: 'error',
              error: err
            }, function(err) {
              if (err) $log.debug(err);
            });
            return;
          }
          _updateCoinbasePendingTransactions(dataFromStorage, tx.data);
          self.coinbasePendingTransactions[txId] = dataFromStorage;
          if (tx.data.type == 'send' && tx.data.status == 'completed' && tx.data.from) {
            coinbaseService.sellPrice(accessToken, dataFromStorage.sell_price_currency, function(err, s) {
              if (err) {
                if (err.errors[0] && err.errors[0].id == 'expired_token') {
                  self.refreshCoinbaseToken();
                  return;
                }
                coinbaseService.savePendingTransaction(dataFromStorage, {
                  status: 'error',
                  error: err
                }, function(err) {
                  if (err) $log.debug(err);
                });
                return;
              }
              var newSellPrice = s.data.amount;
              var variance = Math.abs((newSellPrice - dataFromStorage.sell_price_amount) / dataFromStorage.sell_price_amount * 100);
              if (variance < dataFromStorage.price_sensitivity.value) {
                self.sellPending(tx.data);
              } else {
                var error = {
                  errors: [{
                    message: 'Price falls over the selected percentage'
                  }]
                };
                coinbaseService.savePendingTransaction(dataFromStorage, {
                  status: 'error',
                  error: error
                }, function(err) {
                  if (err) $log.debug(err);
                });
              }
            });
          } else if (tx.data.type == 'buy' && tx.data.status == 'completed' && tx.data.buy) {
            self.sendToCopay(dataFromStorage);
          } else {
            coinbaseService.savePendingTransaction(dataFromStorage, {}, function(err) {
              if (err) $log.debug(err);
            });
          }
        });
      });
    });

  }, 1000);

  var _updateCoinbasePendingTransactions = function(obj /*, …*/ ) {
    for (var i = 1; i < arguments.length; i++) {
      for (var prop in arguments[i]) {
        var val = arguments[i][prop];
        if (typeof val == "object")
          _updateCoinbasePendingTransactions(obj[prop], val);
        else
          obj[prop] = val ? val : obj[prop];
      }
    }
    return obj;
  };

  self.refreshCoinbaseToken = function() {
    var network = self.coinbaseTestnet ? 'testnet' : 'livenet';
    storageService.getCoinbaseRefreshToken(network, function(err, refreshToken) {
      if (!refreshToken) return;
      coinbaseService.refreshToken(refreshToken, function(err, data) {
        if (err) {
          self.coinbaseError = err;
        } else if (data && data.access_token && data.refresh_token) {
          storageService.setCoinbaseToken(network, data.access_token, function() {
            storageService.setCoinbaseRefreshToken(network, data.refresh_token, function() {
              $timeout(function() {
                self.initCoinbase(data.access_token);
              }, 100);
            });
          });
        }
      });
    });
  };

  self.sendToCopay = function(tx) {
    if (!tx) return;
    var data = {
      to: tx.toAddr,
      amount: tx.amount.amount,
      currency: tx.amount.currency,
      description: 'To Copay Wallet'
    };
    coinbaseService.sendTo(self.coinbaseToken, self.coinbaseAccount.id, data, function(err, res) {
      if (err) {
        if (err.errors[0] && err.errors[0].id == 'expired_token') {
          self.refreshCoinbaseToken();
          return;
        }
        coinbaseService.savePendingTransaction(tx, {
          status: 'error',
          error: err
        }, function(err) {
          if (err) $log.debug(err);
        });
      } else {
        if (!res.data.id) {
          coinbaseService.savePendingTransaction(tx, {
            status: 'error',
            error: err
          }, function(err) {
            if (err) $log.debug(err);
          });
          return;
        }
        coinbaseService.getTransaction(self.coinbaseToken, self.coinbaseAccount.id, res.data.id, function(err, sendTx) {
          coinbaseService.savePendingTransaction(tx, {
            remove: true
          }, function(err) {
            coinbaseService.savePendingTransaction(sendTx.data, {}, function(err) {
              $timeout(function() {
                self.updateCoinbase({
                  updateAccount: true
                });
              }, 1000);
            });
          });
        });
      }
    });
  };

  self.sellPending = function(tx) {
    if (!tx) return;
    var data = tx.amount;
    data['commit'] = true;
    coinbaseService.sellRequest(self.coinbaseToken, self.coinbaseAccount.id, data, function(err, res) {
      if (err) {
        if (err.errors[0] && err.errors[0].id == 'expired_token') {
          self.refreshCoinbaseToken();
          return;
        }
        coinbaseService.savePendingTransaction(tx, {
          status: 'error',
          error: err
        }, function(err) {
          if (err) $log.debug(err);
        });
      } else {
        if (!res.data.transaction) {
          coinbaseService.savePendingTransaction(tx, {
            status: 'error',
            error: err
          }, function(err) {
            if (err) $log.debug(err);
          });
          return;
        }
        coinbaseService.savePendingTransaction(tx, {
          remove: true
        }, function(err) {
          coinbaseService.getTransaction(self.coinbaseToken, self.coinbaseAccount.id, res.data.transaction.id, function(err, updatedTx) {
            coinbaseService.savePendingTransaction(updatedTx.data, {}, function(err) {
              if (err) $log.debug(err);
              $timeout(function() {
                self.updateCoinbase({
                  updateAccount: true
                });
              }, 1000);
            });
          });
        });
      }
    });
  };

  self.isInFocus = function(walletId) {
    var fc = profileService.focusedClient;
    return fc && fc.credentials.walletId == walletId;
  };

  self.setAddressbook = function(ab) {
    if (ab) {
      self.addressbook = ab;
      return;
    }

    addressbookService.list(function(err, ab) {
      if (err) {
        $log.error('Error getting the addressbook');
        return;
      }
      self.addressbook = ab;
    });
  };

  $rootScope.$on('$stateChangeSuccess', function(ev, to, toParams, from, fromParams) {
    self.prevState = from.name || 'walletHome';
    self.tab = 'walletHome';
  });

  $rootScope.$on('Local/ValidatingWalletEnded', function(ev, walletId, isOK) {

    if (self.isInFocus(walletId)) {
      // NOTE: If the user changed the wallet, the flag is already turn off.
      self.incorrectDerivation = isOK === false;
    }
  });

  $rootScope.$on('Local/ClearHistory', function(event) {
    $log.debug('The wallet transaction history has been deleted');
    self.txHistory = self.completeHistory = self.txHistorySearchResults = [];
    self.debounceUpdateHistory();
  });

  $rootScope.$on('Local/AddressbookUpdated', function(event, ab) {
    self.setAddressbook(ab);
  });

  // UX event handlers
  $rootScope.$on('Local/ColorUpdated', function(event) {
    self.updateColor();
    $timeout(function() {
      $rootScope.$apply();
    });
  });

  $rootScope.$on('Local/AliasUpdated', function(event) {
    self.updateAlias();
    $timeout(function() {
      $rootScope.$apply();
    });
  });

  $rootScope.$on('Local/SpendUnconfirmedUpdated', function(event, spendUnconfirmed) {
    self.setSpendUnconfirmed(spendUnconfirmed);
    self.updateAll();
  });

  $rootScope.$on('Local/GlideraUpdated', function(event, accessToken) {
    self.initGlidera(accessToken);
  });

  $rootScope.$on('Local/CoinbaseUpdated', function(event, accessToken) {
    self.initCoinbase(accessToken);
  });

  $rootScope.$on('Local/GlideraTx', function(event, accessToken, permissions) {
    self.updateGlidera();
  });

  $rootScope.$on('Local/CoinbaseTx', function(event) {
    self.updateCoinbase({
      updateAccount: true
    });
  });

  $rootScope.$on('Local/GlideraError', function(event) {
    self.debouncedUpdate();
  });

  $rootScope.$on('Local/UnitSettingUpdated', function(event) {
    self.updateAll({
      triggerTxUpdate: true,
    });
  });

  $rootScope.$on('Local/WalletCompleted', function(event, walletId) {
    if (self.isInFocus(walletId)) {
      // reset main wallet variables
      self.setFocusedWallet();
      go.walletHome();
    }
  });

  self.debouncedUpdate = function() {
    var now = Date.now();
    var oneHr = 1000 * 60 * 60;

    if (!self.lastUpdate || (now - self.lastUpdate) > oneHr) {
      self.updateAll({
        quiet: true,
        triggerTxUpdate: true
      });
    }
  };

  $rootScope.$on('Local/Resume', function(event) {
    $log.debug('### Resume event');
    profileService.isDisclaimerAccepted(function(v) {
      if (!v) {
        $log.debug('Disclaimer not accepted, resume to home');
        go.path('disclaimer');
      }
    });
    self.debouncedUpdate();
  });

  $rootScope.$on('Local/BackupDone', function(event, walletId) {
    self.needsBackup = false;
    $log.debug('Backup done');
    storageService.setBackupFlag(walletId || self.walletId, function(err) {
      $log.debug('Backup stored');
    });
  });

  $rootScope.$on('Local/DeviceError', function(event, err) {
    self.showErrorPopup(err, function() {
      if (isCordova && navigator && navigator.app) {
        navigator.app.exitApp();
      }
    });
  });

  $rootScope.$on('Local/WalletImported', function(event, walletId) {
    self.needsBackup = false;
    storageService.setBackupFlag(walletId, function() {
      $log.debug('Backup done stored');
      addressService.expireAddress(walletId, function(err) {
        $timeout(function() {
          self.txHistory = self.completeHistory = self.txHistorySearchResults = [];
          storageService.removeTxHistory(walletId, function() {
            self.startScan(walletId);
          });
        }, 500);
      });
    });
  });

  $rootScope.$on('NewIncomingTx', function() {
    self.newTx = true;
    self.updateAll({
      walletStatus: null,
      untilItChanges: true,
      triggerTxUpdate: true,
    });
  });


  $rootScope.$on('NewBlock', function() {
    if (self.glideraEnabled) {
      $timeout(function() {
        self.updateGlidera();
      });
    }
    if (self.coinbaseEnabled) {
      $timeout(function() {
        self.updateCoinbase();
      });
    }
    if (self.pendingAmount) {
      self.updateAll({
        walletStatus: null,
        untilItChanges: null,
        triggerTxUpdate: true,
      });
    } else if (self.hasUnsafeConfirmed) {
      $log.debug('Wallet has transactions with few confirmations. Updating.')
      if (self.network == 'testnet') {
        self.throttledUpdateHistory();
      } else {
        self.debounceUpdateHistory();
      }
    }
  });

  $rootScope.$on('BalanceUpdated', function(e, n) {
    self.setBalance(n.data);
  });


  //untilItChange TRUE
  lodash.each(['NewOutgoingTx', 'NewOutgoingTxByThirdParty'], function(eventName) {
    $rootScope.$on(eventName, function(event) {
      self.newTx = true;
      self.updateAll({
        walletStatus: null,
        untilItChanges: true,
        triggerTxUpdate: true,
      });
    });
  });

  //untilItChange FALSE
  lodash.each(['NewTxProposal', 'TxProposalFinallyRejected', 'TxProposalRemoved', 'NewOutgoingTxByThirdParty',
    'Local/GlideraTx'
  ], function(eventName) {
    $rootScope.$on(eventName, function(event) {
      self.updateAll({
        walletStatus: null,
        untilItChanges: null,
        triggerTxUpdate: true,
      });
    });
  });


  //untilItChange Maybe
  $rootScope.$on('Local/TxProposalAction', function(event, untilItChanges) {
    self.newTx = untilItChanges;
    self.updateAll({
      walletStatus: null,
      untilItChanges: untilItChanges,
      triggerTxUpdate: true,
    });
  });

  $rootScope.$on('ScanFinished', function() {
    $log.debug('Scan Finished. Updating history');
    storageService.removeTxHistory(self.walletId, function() {
      self.updateAll({
        walletStatus: null,
        triggerTxUpdate: true,
      });
    });
  });

  lodash.each(['TxProposalRejectedBy', 'TxProposalAcceptedBy'], function(eventName) {
    $rootScope.$on(eventName, function() {
      var f = function() {
        if (self.updating) {
          return $timeout(f, 200);
        };
        self.updatePendingTxps();
      };
      f();
    });
  });

  $rootScope.$on('Local/NoWallets', function(event) {
    $timeout(function() {
      self.hasProfile = true;
      self.noFocusedWallet = true;
      self.isComplete = null;
      self.walletName = null;
      uxLanguage.update();
    });
  });

  $rootScope.$on('Local/NewFocusedWallet', function() {
    uxLanguage.update();
    self.setFocusedWallet();
    self.updateHistory();
    storageService.getCleanAndScanAddresses(function(err, walletId) {

      if (walletId && profileService.walletClients[walletId]) {
        $log.debug('Clear last address cache and Scan ', walletId);
        addressService.expireAddress(walletId, function(err) {
          self.startScan(walletId);
        });
        storageService.removeCleanAndScanAddresses(function() {
          $rootScope.$emit('Local/NewFocusedWalletReady');
        });
      } else {
        $rootScope.$emit('Local/NewFocusedWalletReady');
      }
    });
  });

  $rootScope.$on('Local/SetTab', function(event, tab, reset) {
    self.setTab(tab, reset);
  });

  $rootScope.$on('disclaimerAccepted', function(event) {
    $scope.isDisclaimerAccepted = true;
  });

  $rootScope.$on('Local/WindowResize', function() {
    self.physicalScreenWidth = ((window.innerWidth > 0) ? window.innerWidth : screen.width);
  });

  $rootScope.$on('Local/NeedsConfirmation', function(event, txp, cb) {

    function openConfirmationPopup(txp, cb) {

      var config = configService.getSync();

      $scope.color = config.colorFor[txp.walletId] || '#4A90E2';
      $scope.tx = txFormatService.processTx(txp);

      self.confirmationPopup = $ionicPopup.show({
        templateUrl: 'views/includes/confirm-tx.html',
        scope: $scope,
      });

      $scope.processFee = function(amount, fee) {
        var walletSettings = configService.getSync().wallet.settings;
        var feeAlternativeIsoCode = walletSettings.alternativeIsoCode;

        $scope.feeLevel = feeService.feeOpts[feeService.getCurrentFeeLevel()];
        $scope.feeAlternativeStr = parseFloat((rateService.toFiat(fee, feeAlternativeIsoCode)).toFixed(2), 10) + ' ' + feeAlternativeIsoCode;
        $scope.feeRateStr = (fee / (amount + fee) * 100).toFixed(2) + '%';
      };

      $scope.cancel = function() {
        return cb();
      };

      $scope.accept = function() {
        return cb(true);
      };
    }

    openConfirmationPopup(txp, function(accept) {
      self.confirmationPopup.close();
      return cb(accept);
    });
  });

  $rootScope.$on('Local/NeedsPassword', function(event, isSetup, cb) {

    function openPasswordPopup(isSetup, cb) {
      $scope.data = {};
      $scope.data.password = null;
      $scope.isSetup = isSetup;
      $scope.isVerification = false;
      $scope.loading = false;
      var pass = null;

      self.passwordPopup = $ionicPopup.show({
        templateUrl: 'views/includes/password.html',
        scope: $scope,
      });

      $scope.cancel = function() {
        return cb('No spending password given');
      };

      $scope.keyPress = function(event) {
        if (!$scope.data.password || $scope.loading) return;
        if (event.keyCode == 13) $scope.set();
      }

      $scope.set = function() {
        $scope.loading = true;
        $scope.error = null;

        $timeout(function() {
          if (isSetup && !$scope.isVerification) {
            $scope.loading = false;
            $scope.isVerification = true;
            pass = $scope.data.password;
            $scope.data.password = null;
            return;
          }
          if (isSetup && pass != $scope.data.password) {
            $scope.loading = false;
            $scope.error = gettext('Spending Passwords do not match');
            $scope.isVerification = false;
            $scope.data.password = null;
            pass = null;
            return;
          }
          return cb(null, $scope.data.password);
        }, 100);
      };
    };

    openPasswordPopup(isSetup, function(err, pass) {
      self.passwordPopup.close();
      return cb(err, pass);
    });

  });

  $rootScope.$on('Local/EmailUpdated', function(event, email) {
    self.preferences.email = email;
  });

  lodash.each(['NewCopayer', 'CopayerUpdated'], function(eventName) {
    $rootScope.$on(eventName, function() {
      // Re try to open wallet (will triggers)
      self.setFocusedWallet();
    });
  });

  $rootScope.$on('Local/NewEncryptionSetting', function() {
    var fc = profileService.focusedClient;
    self.isPrivKeyEncrypted = fc.isPrivKeyEncrypted();
    $timeout(function() {
      $rootScope.$apply();
    });
  });


  /* Start setup */
  lodash.assign(self, vanillaScope);
  openURLService.init();
});
