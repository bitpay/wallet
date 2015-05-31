'use strict';

angular.module('copayApp.controllers').controller('indexController', function($rootScope, $scope, $log, $filter, $timeout, lodash, go, profileService, configService, isCordova, rateService, storageService, gettextCatalog, gettext, amMoment) {

  var self = this;
  self.isCordova = isCordova;
  self.onGoingProcess = {};
  self.limitHistory = 5;

  function strip(number) {
    return (parseFloat(number.toPrecision(12)));
  };


  self.goHome = function() {
    go.walletHome();
  };


  self.menu = [{
    'title': gettext('Home'),
    'icon': 'icon-home',
    'link': 'walletHome'
  }, {
    'title': gettext('Receive'),
    'icon': 'icon-receive2',
    'link': 'receive'
  }, {
    'title': gettext('Send'),
    'icon': 'icon-paperplane',
    'link': 'send'
  }, {
    'title': gettext('History'),
    'icon': 'icon-history',
    'link': 'history'
  }];

  self.tab = 'walletHome';

  self.availableLanguages = [{
    name: gettext('English'),
    isoCode: 'en',
  }, {
    name: gettext('Spanish'),
    isoCode: 'es',
  }, {
    name: gettext('French'),
    isoCode: 'fr',
  }, {
    name: gettext('Japanese'),
    isoCode: 'ja',
  }];

  self.setOngoingProcess = function(processName, isOn) {
    $log.debug('onGoingProcess', processName, isOn);
    self[processName] = isOn;
    self.onGoingProcess[processName] = isOn;

    var name;
    self.anyOnGoingProcess = lodash.any(self.onGoingProcess, function(isOn, processName) {
      if (isOn)
        name = name || processName;
      return isOn;
    });
    // The first one
    self.onGoingProcessName = name;
    $timeout(function() {
      $rootScope.$apply();
    });
  };

  self.setFocusedWallet = function() {
    var fc = profileService.focusedClient;
    if (!fc) return;

    // Clean status
    self.lockedBalance = null;
    self.availableBalanceStr = null;
    self.totalBalanceStr = null;
    self.lockedBalanceStr = null;
    self.totalBalanceStr = null;
    self.alternativeBalanceAvailable = false;
    self.totalBalanceAlternative = null;
    self.notAuthorized = false;
    self.txHistory = [];
    self.txHistoryPaging = false;
    self.pendingTxProposalsCountForUs = null;
    $timeout(function() {
      self.hasProfile = true;
      self.noFocusedWallet = false;
      self.onGoingProcess = {};

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
      self.txps = [];
      self.copayers = [];
      self.updateColor();
      self.updateAlias();

      storageService.getBackupFlag(self.walletId, function(err, val) {
        self.needsBackup = self.network == 'testnet' ? false : !val;
        self.openWallet();
      });
    });
  };

  self.setTab = function(tab, reset, tries) {
    tries = tries || 0;
    if (self.tab === tab && !reset)
      return;

    if (!document.getElementById('menu-' + tab) && ++tries < 5) {
      return $timeout(function() {
        self.setTab(tab, reset, tries);
      }, 300);
    }

    if (!self.tab)
      self.tab = 'walletHome';

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


  self.updatePreferences = function(cb) {
    var fc = profileService.focusedClient;
    fc.getPreferences(function(err, preferences) {
      if (err) {
        self.handleError(err);
        return cb(err);
      }
      self.preferences = preferences;
      return cb(err, preferences);
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

  self.updateAll = function(walletStatus, untilItChanges, initStatusHash, tries) {
    tries = tries || 0;
    if (untilItChanges && lodash.isUndefined(initStatusHash)) {
      initStatusHash = _walletStatusHash();
      $log.debug('Updating status until it changes. initStatusHash:' + initStatusHash)
    }
    var get = function(cb) {
      if (walletStatus)
        return cb(null, walletStatus);
      else {
        self.updateError = false;
        return fc.getStatus(function(err, ret) {
          if (err) {
            self.updateError = true;
          } else {
            self.setOngoingProcess('scanning', ret.wallet.scanning);
          }
          return cb(err, ret);
        });
      }
    };

    var fc = profileService.focusedClient;
    if (!fc) return;

    $timeout(function() {
      self.setOngoingProcess('updatingStatus', true);
      $log.debug('Updating Status:', fc, tries);
      get(function(err, walletStatus) {
        var currentStatusHash = _walletStatusHash(walletStatus); 
        $log.debug('Status update. hash:' + currentStatusHash + ' Try:'+ tries); 
        if (!err && untilItChanges && initStatusHash == currentStatusHash && tries < 7) {
          return $timeout(function() {
            $log.debug('Retrying update... Try:' + tries)
            return self.updateAll(null, true, initStatusHash, ++tries);
          }, 1400 * tries);
        }
        self.setOngoingProcess('updatingStatus', false);
        if (err) {
          self.handleError(err);
          return;
        }
        $log.debug('Wallet Status:', walletStatus);
        self.setPendingTxps(walletStatus.pendingTxps);

        // Status Shortcuts
        self.walletName = walletStatus.wallet.name;
        self.walletSecret = walletStatus.wallet.secret;
        self.walletStatus = walletStatus.wallet.status;
        self.walletScanStatus = walletStatus.wallet.scanStatus;
        self.copayers = walletStatus.wallet.copayers;
        self.preferences = walletStatus.preferences;
        self.setBalance(walletStatus.balance);
        $rootScope.$apply();
      });
    });
  };

  self.updateBalance = function() {
    var fc = profileService.focusedClient;
    $timeout(function() {
      self.setOngoingProcess('updatingBalance', true);
      $log.debug('Updating Balance');
      fc.getBalance(function(err, balance) {
        self.setOngoingProcess('updatingBalance', false);
        if (err) {
          $log.debug('Wallet Balance ERROR:', err);
          $scope.$emit('Local/ClientError', err);
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
      self.setOngoingProcess('updatingPendingTxps', true);
      $log.debug('Updating PendingTxps');
      fc.getTxProposals({}, function(err, txps) {
        self.setOngoingProcess('updatingPendingTxps', false);
        if (err) {
          $log.debug('Wallet PendingTxps ERROR:', err);
          $scope.$emit('Local/ClientError', err);
        } else {
          $log.debug('Wallet PendingTxps:', txps);
          self.setPendingTxps(txps);
        }
        $rootScope.$apply();
      });
    });
  };

  self.updateTxHistory = function(skip) {
    var fc = profileService.focusedClient;
    if (!fc.isComplete()) return;

    if (!skip) {
      self.txHistory = [];
    }
    self.skipHistory = skip || 0;
    $log.debug('Updating Transaction History');
    self.txHistoryError = false;
    self.updatingTxHistory = true;
    self.txHistoryPaging = false;
    $timeout(function() {
      fc.getTxHistory({
        skip: self.skipHistory,
        limit: self.limitHistory + 1
      }, function(err, txs) {
        self.updatingTxHistory = false;
        if (err) {
          $log.debug('TxHistory ERROR:', err);
          // We do not should errors here, since history is usually
          // fetched AFTER others requests.
          //self.handleError(err);
          self.txHistoryError = true;
        } else {
          $log.debug('Wallet Transaction History:', txs);
          self.skipHistory = self.skipHistory + self.limitHistory;
          self.setTxHistory(txs);
        }
        $rootScope.$apply();
      });
    });
  };

  self.handleError = function(err) {
    $log.warn('Client ERROR:', err);
    if (err.code === 'NOTAUTHORIZED') {
      $scope.$emit('Local/NotAuthorized');
    } else if (err.code === 'NOTFOUND') {
      $scope.$emit('Local/BWSNotFound');
    } else {
      $scope.$emit('Local/ClientError', (err.error ? err.error : err));
    }
  };
  self.openWallet = function() {
    var fc = profileService.focusedClient;
    $timeout(function() {
      $rootScope.$apply();
      self.setOngoingProcess('openingWallet', true);
      self.updateError = false;
      fc.openWallet(function(err, walletStatus) {
        self.setOngoingProcess('openingWallet', false);
        if (err) {
          self.updateError = true;
          self.handleError(err);
          return;
        }
        $log.debug('Wallet Opened');
        self.updateAll(lodash.isObject(walletStatus) ? walletStatus : null);
        $rootScope.$apply();
      });
    });
  };

  self.setPendingTxps = function(txps) {
    var config = configService.getSync().wallet.settings;
    self.pendingTxProposalsCountForUs = 0;
    lodash.each(txps, function(tx) {
      var amount = tx.amount * self.satToUnit;
      tx.amountStr = profileService.formatAmount(tx.amount) + ' ' + config.unitName;
      tx.alternativeAmount = rateService.toFiat(tx.amount, config.alternativeIsoCode) ? rateService.toFiat(tx.amount, config.alternativeIsoCode).toFixed(2) : 'N/A';
      tx.alternativeAmountStr = tx.alternativeAmount + " " + config.alternativeIsoCode;
      tx.alternativeIsoCode = config.alternativeIsoCode;



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

      if (tx.creatorId == self.copayerId && tx.actions.length == 1) {
        tx.couldRemove = true;
      };

      if (tx.creatorId != self.copayerId) {
        self.pendingTxProposalsCountForUs = self.pendingTxProposalsCountForUs + 1;
      }
    });
    self.txps = txps;
  };

  self.setTxHistory = function(txs) {
    var now = new Date();
    var c = 0;
    self.txHistoryPaging = txs[self.limitHistory] ? true : false;
    lodash.each(txs, function(tx) {
      tx.ts = tx.minedTs || tx.sentTs;
      // no future transaction...
      if (tx.ts > now)
        ts.ts = now;
      tx.rateTs = Math.floor((tx.ts || now) / 1000);
      tx.amountStr = profileService.formatAmount(tx.amount); //$filter('noFractionNumber')(
      if (c < self.limitHistory) {
        self.txHistory.push(tx);
        c++;
      }
    });
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
  };

  self.setBalance = function(balance) {
    if (!balance) return;
    var config = configService.getSync().wallet.settings;
    var COIN = 1e8;

    // Address with Balance
    self.balanceByAddress = balance.byAddress;

    // SAT
    self.totalBalanceSat = balance.totalAmount;
    self.lockedBalanceSat = balance.lockedAmount;
    self.availableBalanceSat = self.totalBalanceSat - self.lockedBalanceSat;

    // Selected unit
    self.unitToSatoshi = config.unitToSatoshi;
    self.satToUnit = 1 / self.unitToSatoshi;
    self.unitName = config.unitName;

    self.totalBalance = strip(self.totalBalanceSat * self.satToUnit);
    self.lockedBalance = strip(self.lockedBalanceSat * self.satToUnit);
    self.availableBalance = strip(self.availableBalanceSat * self.satToUnit);

    // BTC
    self.totalBalanceBTC = strip(self.totalBalanceSat / COIN);
    self.lockedBalanceBTC = strip(self.lockedBalanceSat / COIN);
    self.availableBalanceBTC = strip(self.availableBalanceBTC / COIN);


    //STR
    self.totalBalanceStr = profileService.formatAmount(self.totalBalanceSat) + ' ' + self.unitName;
    self.lockedBalanceStr = profileService.formatAmount(self.lockedBalanceSat) + ' ' + self.unitName;
    self.availableBalanceStr = profileService.formatAmount(self.availableBalanceSat) + ' ' + self.unitName;

    self.alternativeName = config.alternativeName;
    self.alternativeIsoCode = config.alternativeIsoCode;

    // Check address
    self.checkLastAddress(balance.byAddress);

    rateService.whenAvailable(function() {

      var totalBalanceAlternative = rateService.toFiat(self.totalBalance * self.unitToSatoshi, self.alternativeIsoCode);
      var lockedBalanceAlternative = rateService.toFiat(self.lockedBalance * self.unitToSatoshi, self.alternativeIsoCode);
      var alternativeConversionRate = rateService.toFiat(100000000, self.alternativeIsoCode);

      self.totalBalanceAlternative = $filter('noFractionNumber')(totalBalanceAlternative, 2);
      self.lockedBalanceAlternative = $filter('noFractionNumber')(lockedBalanceAlternative, 2);
      self.alternativeConversionRate = $filter('noFractionNumber')(alternativeConversionRate, 2);

      self.alternativeBalanceAvailable = true;
      self.updatingBalance = false;

      self.isRateAvailable = true;
      $rootScope.$apply();
    });

    if (!rateService.isAvailable()) {
      $rootScope.$apply();
    }
  };

  self.checkLastAddress = function(byAddress, cb) {
    storageService.getLastAddress(self.walletId, function(err, addr) {
      var used = lodash.find(byAddress, {
        address: addr
      });
      if (used) {
        $log.debug('Address ' + addr + ' was used. Cleaning Cache.')
        storageService.clearLastAddress(self.walletId, function(err) {
          $rootScope.$emit('Local/NeedNewAddress', err);
          if (cb) return cb();
        });
      };
    });
  };


  self.clientError = function(err) {
    if (isCordova) {
      navigator.notification.confirm(
        err,
        function() {},
        'Wallet Server Error', ['OK']
      );
    } else {
      alert(err);
    }
  };

  self.deviceError = function(err) {
    if (isCordova) {
      navigator.notification.confirm(
        err,
        function() {},
        'Device Error', ['OK']
      );
    } else {
      alert(err);
    }
  };


  self.recreate = function(cb) {
    var fc = profileService.focusedClient;
    self.setOngoingProcess('recreating', true);
    fc.recreateWallet(function(err) {
      self.notAuthorized = false;
      self.setOngoingProcess('recreating', false);

      if (err) {
        self.handleError(err);
        $rootScope.$apply();
        return;
      }

      profileService.setWalletClients();
      $timeout(function() {
        $rootScope.$emit('Local/WalletImported', self.walletId);
      }, 100);
    });
  };

  self.openMenu = function() {
    go.swipe(true);
  };

  self.closeMenu = function() {
    go.swipe();
  };

  self.retryScan = function() {
    var self = this;
    self.startScan(self.walletId);
  }

  self.startScan = function(walletId) {
    var c = profileService.walletClients[walletId];

    if (self.walletId == walletId)
      self.setOngoingProcess('scanning', true);

    c.startScan({
      includeCopayerBranches: true,
    }, function(err) {
      if (err) {
        if (self.walletId == walletId)
          self.setOngoingProcess('scanning', false);
        self.handleError(err);
        $rootScope.$apply();
      }
    });
  };

  self.setDefaultLanguage = function(setLang) {
    var userLang;
    if (!setLang) {
      userLang = configService.getSync().wallet.settings.defaultLanguage;
      if (!userLang) {
        // Auto-detect browser language
        var androidLang;

        if (navigator && navigator.userAgent && (androidLang = navigator.userAgent.match(/android.*\W(\w\w)-(\w\w)\W/i))) {
          userLang = androidLang[1];
        } else {
          // works for iOS and Android 4.x
          userLang = navigator.userLanguage || navigator.language;
        }
        userLang = userLang ? (userLang.split('-', 1)[0] || 'en') : 'en';
      }
      if (userLang != gettextCatalog.getCurrentLanguage()) {
        $log.debug('Setting default language: ' + userLang);
        gettextCatalog.setCurrentLanguage(userLang);
        amMoment.changeLocale(userLang);
      }
    } else {
      configService.set({
        wallet: {
          settings: {
            defaultLanguage: setLang
          }
        }
      }, function() {
        gettextCatalog.setCurrentLanguage(setLang);
        amMoment.changeLocale(setLang);
      });
    }
    self.defaultLanguageIsoCode = setLang || userLang;
    self.defaultLanguageName = lodash.result(lodash.find(self.availableLanguages, {
      'isoCode': self.defaultLanguageIsoCode
    }), 'name');
  };

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

  $rootScope.$on('Local/UnitSettingUpdated', function(event) {
    self.updateAll();
    self.updateTxHistory();
  });


  $rootScope.$on('Local/EmailUpdated', function(event, cb) {
    self.updatePreferences(cb);
  });

  $rootScope.$on('Local/BWSUpdated', function(event) {
    profileService.applyConfig();
  });

  $rootScope.$on('Local/WalletCompleted', function(event) {
    self.setFocusedWallet();
    go.walletHome();
  });

  self.debouncedUpdate = lodash.throttle(function() {
    self.updateAll();
    self.updateTxHistory();
  }, 4000, {
    leading: false,
    trailing: true
  });


  // No need ot listing to Local/Resume since
  // reconnection and Local/Online will be triggered
  lodash.each(['Local/Online', 'Local/Resume'], function(eventName) {
    $rootScope.$on(eventName, function(event) {
      $log.debug('### ' + eventName + ' event');
      self.debouncedUpdate();
    });
  });

  $rootScope.$on('Local/Online', function(event) {
    self.isOffline = false;
    self.offLineSince = null;
  });

  self.offLineSince = null;;
  $rootScope.$on('Local/Offline', function(event) {
    $log.debug('### Offline event');
    if (!self.offLineSince) self.offLineSince = Date.now();

    if (Date.now() - self.offLineSince > 10000) {
      self.isOffline = true;
      $timeout(function() {
        $rootScope.$apply();
      });
    }
  });

  $rootScope.$on('Local/BackupDone', function(event) {
    self.needsBackup = false;
    storageService.setBackupFlag(self.walletId, function(err) {
      if (err) $rootScope.$emit('Local/DeviceError', err)
    });
  });

  $rootScope.$on('Local/NotAuthorized', function(event) {
    self.notAuthorized = true;
    $rootScope.$apply();
  });

  $rootScope.$on('Local/BWSNotFound', function(event) {
    self.clientError('Could not access Wallet Service: Not found');
    $rootScope.$apply();
  });

  $rootScope.$on('Local/DeviceError', function(event, err) {
    self.deviceError(err);
    $rootScope.$apply();
  });

  $rootScope.$on('Local/ClientError', function(event, err) {
    if (err.code && err.code === 'NOTAUTHORIZED') {
      // Show not error, just redirect to home (where the recreate option is shown)
      go.walletHome();
    } else if (err && err.cors == 'rejected') {
      $log.debug('CORS error:', err);
    } else if (err.code === 'ETIMEDOUT' || err.code === 'CONNERROR') {
      $log.debug('Time out:', err);
    } else {
      var msg = 'Error at Wallet Service: ';
      if (err.message) msg = msg + err.message;
      else if (err.error) msg = msg + err.error;
      else msg = msg + (lodash.isObject(err) ? JSON.stringify(err) : err);
      self.clientError(msg);
    }
    $rootScope.$apply();
  });

  $rootScope.$on('Local/WalletImported', function(event, walletId) {
    self.needsBackup = false;
    storageService.setBackupFlag(walletId, function() {
      storageService.clearLastAddress(walletId, function(err) {
        self.startScan(walletId);
      });
    });
  });

  $rootScope.$on('Local/DefaultLanguage', function(event, setLang) {
    self.setDefaultLanguage(setLang);
  });

  $rootScope.$on('NewIncomingTx', function() {
    self.updateBalance();
    $timeout(function() {
      self.updateTxHistory();
    }, 5000);
  });

  $rootScope.$on('NewOutgoingTx', function() {
    self.updateAll(null, true);
  });

  lodash.each(['NewTxProposal', 'TxProposalFinallyRejected', 'TxProposalRemoved',
    'Local/NewTxProposal', 'Local/TxProposalAction', 'ScanFinished'
  ], function(eventName) {
    $rootScope.$on(eventName, function(event, untilItChanges) {
      self.updateAll(null, untilItChanges);
      $timeout(function() {
        self.updateTxHistory();
      }, 3000);
    });
  });


  lodash.each(['TxProposalRejectedBy', 'TxProposalAcceptedBy'], function(eventName) {
    $rootScope.$on(eventName, function() {
      var f = function() {
        if (self.updatingStatus) {
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
      go.path('import');
    });
  });

  $rootScope.$on('Local/NewFocusedWallet', function() {
    self.setFocusedWallet();
    self.updateTxHistory();
    go.walletHome();
  });

  $rootScope.$on('Local/SetTab', function(event, tab, reset) {
    self.setTab(tab, reset);
  });

  $rootScope.$on('Local/NeedsPassword', function(event, isSetup, cb) {
    self.askPassword = {
      isSetup: isSetup,
      callback: function(err, pass) {
        self.askPassword = null;
        return cb(err, pass);
      },
    };
  });

  lodash.each(['NewCopayer', 'CopayerUpdated'], function(eventName) {
    $rootScope.$on(eventName, function() {
      // Re try to open wallet (will triggers)
      self.setFocusedWallet();
    });
  });
});
