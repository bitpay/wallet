'use strict';

angular.module('copayApp.controllers').controller('indexController', function($rootScope, $log, $filter, lodash, go, profileService, configService, isCordova, rateService, storageService) {
  var self = this;
  self.isCordova = isCordova;

  function strip(number) {
    return (parseFloat(number.toPrecision(12)));
  };



  self.setFocusedWallet = function() {

    var fc = profileService.focusedClient;
    if (!fc) return;

    self.hasProfile = true;

    // Credentials Shortcuts 
    self.m = fc.m;
    self.n = fc.n;
    self.network = fc.network;
    self.copayerId = fc.copayerId;
    self.requiresMultipleSignatures = fc.m > 1;
    self.isShared = fc.n > 1;
    self.walletName = fc.credentials.walletName;
    self.walletId = fc.credentials.walletId;
    self.isComplete = fc.isComplete;
  };

  self.updateAll = function() {
    var fc = profileService.focusedClient;
    if (!fc) return;
    self.updatingStatus = true;
    $log.debug('Updating Status:', fc);
    fc.getStatus(function(err, walletStatus) {
      $log.debug('Wallet Status:', walletStatus);
      self.setBalance(walletStatus.balance);
      self.setPendingTxps(walletStatus.pendingTxps);

      // Status Shortcuts
      self.walletName = walletStatus.wallet.name;
      self.walletSecret = walletStatus.wallet.secret;
      self.walletStatus = walletStatus.wallet.status;
      self.copayers = walletStatus.wallet.copayers;
      self.updatingStatus = false;
      $rootScope.$apply();
    });
  };

  self.updateBalance = function() {
    var fc = profileService.focusedClient;
    self.updatingBalance = true;
    $log.debug('Updating Balance');
    fc.getBalance(function(err, balance) {
      self.setBalance(balance);
      self.updatingBalance = false;
      $rootScope.$apply();
    });
  };

  self.updatePendingTxps = function() {
    var fc = profileService.focusedClient;
    self.updatingPendingTxps = true;
    $log.debug('Updating PendingTxps');
    fc.getTxProposals({}, function(err, txps) {
      self.setPendingTxps(txps);
      self.updatingPendingTxps = false;
      $rootScope.$apply();
    });
  };

  self.setPendingTxps = function(txps) {
    self.txps = txps;
    var fc = profileService.focusedClient;
    var config = configService.getSync().wallet.settings;
    self.pendingTxProposalsCountForUs = 0;
    lodash.each(txps, function(tx) {
      var amount = tx.amount * self.satToUnit;
      tx.amountStr = profileService.formatAmount(tx.amount) + ' ' + config.unitName;
      tx.alternativeAmount = rateService.toFiat(tx.amount, config.alternativeIsoCode).toFixed(2);
      tx.alternativeAmountStr = tx.alternativeAmount + " " + config.alternativeIsoCode;
      tx.alternativeIsoCode = config.alternativeIsoCode;

      var action = lodash.find(tx.actions, {
        copayerId: self.copayerId
      });
      if (!action && tx.status == 'pending')
        tx.pendingForUs = true;

      if (tx.creatorId != self.copayerId) {
        self.pendingTxProposalsCountForUs = self.pendingTxProposalsCountForUs + 1;
      }
    });
  };


  self.setBalance = function(balance) {
    var fc = profileService.focusedClient;
    console.log('[index.js.48:balance:]', balance); //TODO

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

    // var availableBalanceNr = safeBalanceSat * satToUnit;
    // r.safeUnspentCount = safeUnspentCount;

    // if (r.safeUnspentCount) {
    //   var estimatedFee = copay.Wallet.estimatedFee(r.safeUnspentCount);
    //   r.topAmount = (((availableBalanceNr * w.settings.unitToSatoshi).toFixed(0) - estimatedFee) / w.settings.unitToSatoshi);
    // }
    //

    rateService.whenAvailable(function() {


      var totalBalanceAlternative = rateService.toFiat(self.totalBalance * self.unitToSatoshi, self.alternativeIsoCode);
      var lockedBalanceAlternative = rateService.toFiat(self.lockedBalance * self.unitToSatoshi, self.alternativeIsoCode);
      var alternativeConversionRate = rateService.toFiat(100000000, self.alternativeIsoCode);

      self.totalBalanceAlternative = $filter('noFractionNumber')(totalBalanceAlternative, 2);
      self.lockedBalanceAlternative = $filter('noFractionNumber')(lockedBalanceAlternative, 2);
      self.alternativeConversionRate = $filter('noFractionNumber')(alternativeConversionRate, 2);

      self.alternativeBalanceAvailable = true;

      self.alternativeBalanceAvailable = true;
      self.updatingBalance = false;

      self.isRateAvailable = true;
      $rootScope.$apply();
    });

    // Check address
    self.checkLastAddress(self.walletId, balance.byAddress);
  };

  self.checkLastAddress = function(byAddress, cb) {
    storageService.getLastAddress(self.walletId, function(err, addr) {
      var used = lodash.find(byAddress, {
        address: addr
      });
      if (used) {
        $log.debug('Address ' + addr + ' was used. Cleaning Cache.')
        storageService.clearLastAddress(self.walletId, function(err, addr) {
          if (cb) return cb();
        });
      };
    });
  };

  self.openMenu = function() {
    go.swipe(true);
  }

  self.closeMenu = function() {
    go.swipe();
  }


  // UX event handlers

  $rootScope.$on('Local/ConfigurationUpdated', function(event) {
    self.updateAll();
  });

  $rootScope.$on('Local/WalletCompleted', function(event) {
    go.walletHome();
  });

  $rootScope.$on('Local/OnLine', function(event) {
    self.isOffLine = false;
    self.updateAll();
  });

  $rootScope.$on('Local/OffLine', function(event) {
    self.isOffLine = true;
  });

  lodash.each(['NewTxProposal', 'TxProposalFinallyRejected', 'NewOutgoingTx', 'NewIncomingTx', 'Local/NewTxProposal', 'Local/TxProposalAction'], function(eventName) {
    $rootScope.$on(eventName, function() {
      self.updateAll();
    });
  });


  lodash.each(['TxProposalRejectedBy', 'TxProposalAcceptedBy'], function(eventName) {
    $rootScope.$on(eventName, function() {
      self.updatePendingTxps();
    });
  });

  $rootScope.$on('Local/NewFocusedWallet', function() {
    self.setFocusedWallet();
    self.updateAll();
  });

  lodash.each(['NewCopayer', 'CopayerUpdated'], function(eventName) {
    $rootScope.$on(eventName, function() {
      // Re try to open wallet (will triggers) 
      var fc = profileService.focusedClient;
      fc.openWallet(function() {
        self.updateAll();
      });
    });
  });
});
