'use strict';

angular.module('copayApp.controllers').controller('indexController', function($rootScope, $log, lodash, go, configService) {

  function strip(number) {
    return (parseFloat(number.toPrecision(12)));
  }

  this.pageLoaded = false;
  var self = this;
  $rootScope.$on('newFocusedWallet', function(event, walletStatus) {
    $log.debug('Setting new wallet:', walletStatus);
    self.pageLoaded = true;
    self.hasProfile = true;
    self.walletStatus = walletStatus;

    // Shortcuts
    self.requiresMultipleSignatures = walletStatus.wallet.m > 1;
    self.isShared = walletStatus.wallet.n > 1;

    self.updateBalance(walletStatus.balance);
    self.updateTxps(walletStatus.pendingTxps);
    $rootScope.$apply();
  });

  $rootScope.$on('updateBalance', function(event) {
    profileService.focusedClient.getBalance(function(err, balance) {
      self.updateBalance(balance);
      $rootScope.$apply();
    });
  });

  $rootScope.$on('updatePendingTxs', function(event) {
    profileService.focusedClient.getTxProposals(function(err, txps) {
      self.updateTxps(txps);
      $rootScope.$apply();
    });
  });


  this.updateTxps = function(txps) {
    // TODO
    self.txps = txps;

    lodash.each(txps, function(tx) {
      var amount = tx.amount * self.satToUnit;
      tx.amountStr = amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' ' + self.unitName;
      console.log('[index.js.47:tx:]', tx); //TODO
    });
    // TODO
    // pendingForUs = !tx.signedBy[$root.wallet.getMyCopayerId()] && !tx.rejectedBy[$root.wallet.getMyCopayerId()]
  };


  this.updateBalance = function(balance) {
    console.log('[index.js.48:balance:]', balance); //TODO
    var config = configService.getSync().wallet.settings;
    var COIN = 1e8;
    // SAT
    self.totalBalanceSat = balance.totalAmount;
    self.lockedBalanceSat = balance.lockedAmount;

    // Selected unit
    self.unitToSatoshi = config.unitToSatoshi;
    self.satToUnit = 1 / self.unitToSatoshi;
    self.unitName = config.unitName;
    self.totalBalance = strip(self.totalBalanceSat * self.satToUnit);
    self.lockedBalance = strip(self.lockedBalanceSat * self.satToUnit);

    // BTC
    self.totalBalanceBTC = strip(self.totalBalanceSat / COIN);
    self.lockedBalanceBTC = strip(self.lockedBalanceSat / COIN);

    //STR
    self.totalBalanceStr = self.totalBalance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' ' + self.unitName;
    self.lockedBalanceStr = self.lockedBalance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' ' + self.unitName;



    // var availableBalanceNr = safeBalanceSat * satToUnit;
    // r.availableBalance = $filter('noFractionNumber')(safeBalanceSat * satToUnit);
    // r.availableBalanceBTC = (safeBalanceSat / COIN);
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


  this.openMenu = function() {
    go.swipe(true);
  };

  this.closeMenu = function() {
    go.swipe();
  };
});
