'use strict';

angular.module('copayApp.controllers').controller('confirmTxController', function(configService, feeService, rateService) {


  this.processFee = function(amount, fee) {
    var walletSettings = configService.getSync().wallet.settings;
    var feeAlternativeIsoCode = walletSettings.alternativeIsoCode;

    this.feeLevel = feeService.feeOpts[feeService.getCurrentFeeLevel()];
    this.feeAlternativeStr = parseFloat((rateService.toFiat(fee, feeAlternativeIsoCode)).toFixed(2), 10) + ' ' + feeAlternativeIsoCode;
    this.feeRateStr = (fee / (amount + fee) * 100).toFixed(2) + '%' ;
  };

  this.close = function(cb) {
    return cb();
  };

  this.accept = function(cb) {
    return cb(true);
  };

});
