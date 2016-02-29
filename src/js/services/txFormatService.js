'use strict';

angular.module('copayApp.services').factory('txFormatService', function(profileService, rateService, configService, lodash) {
  var root = {};

  var formatAmountStr = function(amount) {
    if (!amount) return;
    var config = configService.getSync().wallet.settings;
    return profileService.formatAmount(amount) + ' ' + config.unitName;
  };

  var formatAlternativeStr = function(amount) {
    if (!amount) return;
    var config = configService.getSync().wallet.settings;
    return (rateService.toFiat(amount, config.alternativeIsoCode) ? rateService.toFiat(amount, config.alternativeIsoCode).toFixed(2) : 'N/A') + ' ' + config.alternativeIsoCode;
  };

  var formatFeeStr = function(fee) {
    if (!fee) return;
    var config = configService.getSync().wallet.settings;
    return profileService.formatAmount(fee) + ' ' + config.unitName;
  };

  root.processTx = function(tx) {
    if (!tx || tx.action == 'invalid') 
      return tx; 

    // New transaction output format
    if (tx.outputs && tx.outputs.length) {

      var outputsNr = tx.outputs.length;

      if (tx.action != 'received') {
        if (outputsNr > 1) {
          tx.recipientCount = outputsNr;
          tx.hasMultiplesOutputs = true;
        }
        tx.amount = lodash.reduce(tx.outputs, function(total, o) {
          o.amountStr = formatAmountStr(o.amount);
          o.alternativeAmountStr = formatAlternativeStr(o.amount);
          return total + o.amount;
        }, 0);
      }
      tx.toAddress = tx.outputs[0].toAddress;
    } 

    tx.amountStr = formatAmountStr(tx.amount);
    tx.alternativeAmountStr = formatAlternativeStr(tx.amount);
    tx.feeStr = formatFeeStr(tx.fee || tx.fees);

    return tx;
  };

  return root;
});
