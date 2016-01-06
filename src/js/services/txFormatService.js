'use strict';

angular.module('copayApp.services').factory('txFormatService', function(bwcService, rateService, configService, lodash) {
  var root = {};
  root.Utils = bwcService.getUtils();

  root.formatAmount = function(amount) {
    var config = configService.getSync().wallet.settings;
    if (config.unitCode == 'sat') return amount;

    //TODO : now only works for english, specify opts to change thousand separator and decimal separator
    return root.Utils.formatAmount(amount, config.unitCode);
  };

  var formatAmountStr = function(amount) {
    if (!amount) return;
    var config = configService.getSync().wallet.settings;
    return root.formatAmount(amount) + ' ' + config.unitName;
  };

  var formatAlternativeStr = function(amount) {
    if (!amount) return;
    var config = configService.getSync().wallet.settings;
    return (rateService.toFiat(amount, config.alternativeIsoCode) ? rateService.toFiat(amount, config.alternativeIsoCode).toFixed(2) : 'N/A') + ' ' + config.alternativeIsoCode;
  };

  var formatFeeStr = function(fee) {
    if (!fee) return;
    var config = configService.getSync().wallet.settings;
    return root.formatAmount(fee) + ' ' + config.unitName;
  };

  root.processTx = function(tx) {
    if (!tx) return; 

    if (lodash.isArray(tx.outputs) && tx.outputs.length > 0 && tx.action != 'received') {
      tx.hasMultiplesOutputs = true;
      tx.recipientCount = tx.outputs.length;
      tx.amount = lodash.reduce(tx.outputs, function(total, o) {
        o.amountStr = formatAmountStr(o.amount);
        o.alternativeAmountStr = formatAlternativeStr(o.amount);
        return total + o.amount;
      }, 0);
    }

    tx.amountStr = formatAmountStr(tx.amount);
    tx.alternativeAmountStr = formatAlternativeStr(tx.amount);
    tx.feeStr = formatFeeStr(tx.fee || tx.fees);

    return tx;
  };

  return root;
});
