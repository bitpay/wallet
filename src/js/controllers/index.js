'use strict';

angular.module('copayApp.controllers').controller('indexController', function($rootScope, $scope, $log, $filter, $timeout, lodash, go, profileService, configService, isCordova, rateService, storageService) {
  var self = this;
  self.isCordova = isCordova;
  self.onGoingProcess = {};
  self.limitHistory = 5;

  function strip(number) {
    return (parseFloat(number.toPrecision(12)));
  };

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
    self.totalBalanceStr = null;
    self.alternativeBalanceAvailable = false;
    self.totalBalanceAlternative = null;
    self.notAuthorized = false;
    self.clientError = null;
    self.txHistory = [];
    self.txHistoryPaging = false;

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

      storageService.getBackupFlag(self.walletId, function(err, val) {
        self.needsBackup = !val;
        self.openWallet();
      });
    });
  };

  self.updateAll = function(walletStatus) {
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
      $log.debug('Updating Status:', fc);
      get(function(err, walletStatus) {
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
        self.setBalance(walletStatus.balance);
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
      fc.getTxProposals({
      }, function(err, txps) {
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
    if (!skip) {
      self.txHistory = [];
    }
    self.skipHistory = skip || 0;
    $timeout(function() {
      $log.debug('Updating Transaction History');
      self.txHistoryError = false;
      self.updatingTxHistory = true;
      fc.getTxHistory({
        skip: self.skipHistory,
        limit: self.limitHistory + 1
      }, function(err, txs) {
        self.updatingTxHistory = false;
        if (err) {
          $log.debug('TxHistory ERROR:', err);
          self.handleError(err);
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
    $log.debug('ERROR:', err);
    if (err.code === 'NOTAUTHORIZED') {
      $scope.$emit('Local/NotAuthorized');
    } else if (err.code === 'NOTFOUND') {
      $scope.$emit('Local/BWSNotFound');
    } else {
      $scope.$emit('Local/ClientError', err);
    }
  };
  self.openWallet = function() {
    var fc = profileService.focusedClient;
    self.updateColor();
    $timeout(function() {
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
      tx.rateTs = Math.floor((tx.ts || now) / 1000);
      tx.amountStr = profileService.formatAmount(tx.amount); //$filter('noFractionNumber')(
      if (c < self.limitHistory) {
        self.txHistory.push(tx);
        c++;
      }
    });
  };

  self.updateColor = function() {
    var config = configService.getSync();
    config.colorFor = config.colorFor || {};
    self.backgroundColor = config.colorFor[self.walletId] || '#2C3E50';
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
        $rootScope.$emit('Local/NeedNewAddress', err);
        storageService.clearLastAddress(self.walletId, function(err, addr) {
          if (cb) return cb();
        });
      };
    });
  };



  self.recreate = function(cb) {
    var fc = profileService.focusedClient;
    self.setOngoingProcess('recreating', true);
    fc.recreateWallet(function(err) {
      self.notAuthorized = false;
      self.setOngoingProcess('recreating', false);

      if (err) {
        self.clientError = 'Could not recreate wallet:' + err;
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
        self.clientError = 'Could not scan wallet:' + err;
        $rootScope.$apply();
      }
    });
  };


  // UX event handlers
  $rootScope.$on('Local/ColorUpdated', function(event) {
    self.updateColor();
  });

  $rootScope.$on('Local/ConfigurationUpdated', function(event) {
    self.updateAll();
  });

  $rootScope.$on('Local/WalletCompleted', function(event) {
    self.setFocusedWallet();
    go.walletHome();
  });

  lodash.each(['Local/Online', 'Local/Resume'], function(eventName) {
    $rootScope.$on(eventName, function(event) {
      $log.debug('### Online event');
      self.isOffline = false;
      self.clientError = null;
      self.updateAll();
      self.updateTxHistory();
    });
  });

  $rootScope.$on('Local/Offline', function(event) {
    $log.debug('Offline event');
    self.isOffline = true;
  });

  $rootScope.$on('Local/BackupDone', function(event) {
    self.needsBackup = false;
    storageService.setBackupFlag(self.walletId, function() {});
  });

  $rootScope.$on('Local/NotAuthorized', function(event) {
    self.notAuthorized = true;
    $rootScope.$apply();
  });

  $rootScope.$on('Local/BWSNotFound', function(event) {
    self.clientError = 'Could not access to Bitcore Wallet Service: Service not found';
    $rootScope.$apply();
  });

  $rootScope.$on('Local/ClientError', function(event, err) {
    if (err.code && err.code === 'NOTAUTHORIZED') {
      // Show not error, just redirect to home (where the recreate option is shown)
      go.walletHome();
    } else if (err && err.cors == 'rejected') {
      $log.debug('CORS error:', err);
    } else if (err.code === 'ETIMEDOUT') {
      $log.debug('Time out:', err);
    } else {
      self.clientError = err;
    }
    $rootScope.$apply();
  });

  $rootScope.$on('Local/WalletImported', function(event, walletId) {
    self.startScan(walletId);
  });

  $rootScope.$on('Animation/Disable', function(event) {
    $timeout(function() {
      self.swipeLeft = false;
      self.swipeRight = false;
    }, 370);
  });

  $rootScope.$on('Animation/SwipeLeft', function(event) {
    self.swipeLeft = true;
  });

  $rootScope.$on('Animation/SwipeRight', function(event) {
    self.swipeRight = true;
  });


  $rootScope.$on('NewIncomingTx', function() {
    self.updateBalance();
    $timeout(function() {
      self.updateTxHistory();
    }, 5000);
  });


  // remove transactionProposalRemoved (only for compat)

  lodash.each(['NewOutgoingTx', 'NewTxProposal', 'TxProposalFinallyRejected', 'transactionProposalRemoved', 'TxProposalRemoved',
    'Local/NewTxProposal', 'Local/TxProposalAction', 'ScanFinished'
  ], function(eventName) {
    $rootScope.$on(eventName, function() {
      self.updateAll();
      $timeout(function() {
        self.updateTxHistory();
      }, 5000);
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
      self.clientError = null;
      self.isComplete = null;
      self.walletName = null;
      go.addWallet();
    });
  });

  $rootScope.$on('Local/NewFocusedWallet', function() {
    self.setFocusedWallet();
    self.updateTxHistory();
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
