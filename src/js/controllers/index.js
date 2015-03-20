'use strict';

angular.module('copayApp.controllers').controller('indexController', function($rootScope, $log, lodash, go, profileService, configService, isCordova) {
  var self = this;

  function strip(number) {
    return (parseFloat(number.toPrecision(12)));
  }

  self.pageLoaded = false;
  self.isCordova = isCordova;


  $rootScope.$on('updateStatus', function(event) {
    var fc = profileService.focusedClient;
    self.pageLoaded = true; // TODO?
    self.hasProfile = true;

    // Credentials Shortcuts 
    self.m = fc.m;
    self.n = fc.n;
    self.network = fc.network;
    self.requiresMultipleSignatures = fc.m > 1;
    self.isShared = fc.n > 1;

    $log.debug('Updating Status:', fc);
    fc.getStatus(function(err, walletStatus) {
      console.log('[index.js.27:walletStatus:]', walletStatus); //TODO
      self.updateBalance(walletStatus.balance);
      self.updateTxps(walletStatus.pendingTxps);

      // Status Shortcuts
      self.walletName = walletStatus.wallet.name;
      self.walletSecret = walletStatus.wallet.secret;
      self.walletStatus = walletStatus.wallet.status;
      $log.debug('Index: ', self);
      $rootScope.$apply();
    });
  });

  $rootScope.$on('walletWasCompleted', function(event) {
    go.walletHome();
  });

  $rootScope.$on('updateBalance', function(event) {
    profileService.focusedClient.getBalance(function(err, balance) {
      self.updateBalance(balance);
      $rootScope.$apply();
    });
  });

  $rootScope.$on('updatePendingTxs', function(event) {
    profileService.focusedClient.getTxProposals({}, function(err, txps) {
      self.updateTxps(txps);
      $rootScope.$apply();
    });
  });

  self.updateTxps = function(txps) {
    self.txps = txps;
    lodash.each(txps, function(tx) {
      var amount = tx.amount * self.satToUnit;
      tx.amountStr = amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' ' + self.unitName;
      tx.alternativeAmountStr = 'fiat TODO';

      var action = lodash.find(tx.actions, {
        copayerId: self.copayerId
      });
      if (!action && tx.status == 'pending')
        tx.pendingForUs = true;
    });
  };

  self.updateBalance = function(balance) {
    console.log('[index.js.48:balance:]', balance); //TODO
    var config = configService.getSync().wallet.settings;
    var COIN = 1e8;
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
    self.totalBalanceStr = self.totalBalance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' ' + self.unitName;
    self.lockedBalanceStr = self.lockedBalance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' ' + self.unitName;
    self.availableBalanceStr = self.availableBalance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' ' + self.unitName;



    // var availableBalanceNr = safeBalanceSat * satToUnit;
    // r.safeUnspentCount = safeUnspentCount;



    // if (r.safeUnspentCount) {
    //   var estimatedFee = copay.Wallet.estimatedFee(r.safeUnspentCount);
    //   r.topAmount = (((availableBalanceNr * w.settings.unitToSatoshi).toFixed(0) - estimatedFee) / w.settings.unitToSatoshi);
    // }
    //
    // TODO : rateService
    /* rateService.whenAvailable(function() {
    var config = configService.getSync().wallet.settings;
    self.alternativeName = config.alternativeName;
    self.alternativeIsoCode = config.alternativeIsoCode;
    r.totalBalanceAlternative = $filter('noFractionNumber')(totalBalanceAlternative, 2);
    r.lockedBalanceAlternative = $filter('noFractionNumber')(lockedBalanceAlternative, 2);
    r.alternativeConversionRate = $filter('noFractionNumber')(alternativeConversionRate, 2);

    r.alternativeBalanceAvailable = true;
    r.alternativeIsoCode = w.settings.alternativeIsoCode;
*/

    //SET index.alternativeBalanceAvailable
    //         totalBalanceAlternative
    //
    //   self.isRateAvailable = true;
    //   self.$digest();
    // });
    //

    self.updatingBalance = false;
  };


  self.openMenu = function() {
    go.swipe(true);
  };

  self.closeMenu = function() {
    go.swipe();
  };
});
