'use strict';

angular.module('copayApp.controllers').controller('paymentCSController', function($rootScope, $log, copayAppletService, copayWalletService, copayFxService) {

  var self = this;

  this.applet = copayAppletService.getApplet();
  this.appletRoot = this.applet.rootPath();

  var paymentService = this.applet.getService('payment-service');

  // Settings
  // 
  var BITS_PER_BTC = 1e6;
  var fxBits = copayFxService.getRate(copayWalletService.getWalletAltCurrencyIsoCode()) / BITS_PER_BTC;
  var csRateBits = copayFxService.getRate(this.applet.model.csCurrency) / BITS_PER_BTC;

  // Always in bits
  this.min = parseInt(this.applet.model.csMinimum) / csRateBits;
  this.max = parseInt(this.applet.model.csMaximum) / csRateBits;
  this.amount = parseInt(this.applet.model.csAmount) / csRateBits;
  this.displayAmount = this.amount;
  this.currency = copayWalletService.getWalletCurrencyName();

  this.init = function() {
    // Default to showing the alternative currency first.
    this.setCurrency(copayWalletService.getWalletAltCurrencyIsoCode());
  };

  this.getPath = function(uri) {
    return this.appletRoot + uri;
  };

  this.setCurrency = function(c) {
    if (c) {
      this.currency = c;
    } else {
      this.currency = (this.currency == copayWalletService.getWalletCurrencyName() ? copayWalletService.getWalletAltCurrencyIsoCode() : copayWalletService.getWalletCurrencyName());
    }
    this.updateDisplayAmount(this.amount);
  };

  this.updateDisplayAmount = function(value) {
    if (this.currency == 'bits') {
      this.displayAmount = this.amount;
    } else if (this.currency == 'BTC') {
      this.displayAmount = this.amount / BITS_PER_BTC;
    } else {
      this.displayAmount = parseInt(this.amount * fxBits);
    }
  }

  this.onSlide = function(value) {
    self.updateDisplayAmount(value);
  }

  this.onSlideEnd = function(value) {
    self.updateDisplayAmount(value);
    $rootScope.$apply();
  }

  // Services
  // 
  this.pay = function() {
    if (this.paymentService) {

      var amount = this.displayAmount;
      var currency = this.currency;

      // If currency is bits then convert to BTC.
      if (this.currency == 'bits') {
        currency = 'BTC';
        amount = this.displayAmount / BITS_PER_BTC;
      }

      // TODO: this.service.provider.required.buyer.fields
      var data = {
        price: amount,
        currency: currency
      };
      var memo = this.paymentService.memo;

      this.paymentService.createAndSendPayment(data, memo, function(err) {
        if (err) {
          $log.debug('ERROR with payment: '+JSON.stringify(err));
        }
      });
    }
  };

  this.init();
});
