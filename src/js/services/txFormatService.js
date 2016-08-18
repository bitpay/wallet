'use strict';

angular.module('copayApp.services').factory('txFormatService', function(bwcService, rateService, configService, lodash) {
  var root = {};


  // // RECEIVE
  // // Check address
  // root.isUsed(wallet.walletId, balance.byAddress, function(err, used) {
  //   if (used) {
  //     $log.debug('Address used. Creating new');
  //     $rootScope.$emit('Local/AddressIsUsed');
  //   }
  // });
  //

  root.Utils = bwcService.getUtils();


  root.formatAmount = function(satoshis, fullPrecision) {
    var config = configService.getSync().wallet.settings;
    if (config.unitCode == 'sat') return satoshis;

    //TODO : now only works for english, specify opts to change thousand separator and decimal separator
    var opts = {
      fullPrecision: !!fullPrecision
    };
    return this.Utils.formatAmount(satoshis, config.unitCode, opts);
  };

  root.formatAmountStr = function(satoshis) {
    if (!satoshis) return;
    var config = configService.getSync().wallet.settings;
    return root.formatAmount(satoshis) + ' ' + config.unitName;
  };

  root.formatAlternativeStr = function(satoshis, cb) {
    if (!satoshis) return;
    var config = configService.getSync().wallet.settings;

    var val = function() {
      var v1 = rateService.toFiat(satoshis, config.alternativeIsoCode);
      if (!v1) return null;

      return v1.toFixed(2) + ' ' + config.alternativeIsoCode;
    };

    // Async version
    if (cb) {
      rateService.whenAvailable(function() {
        return cb(val());
      });
    } else {
      if (!rateService.isAvailable()) return null;
      return val();
    };
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
          o.amountStr = root.formatAmountStr(o.amount);
          o.alternativeAmountStr = root.formatAlternativeStr(o.amount);
          return total + o.amount;
        }, 0);
      }
      tx.toAddress = tx.outputs[0].toAddress;
    } 

    tx.amountStr = root.formatAmountStr(tx.amount);
    tx.alternativeAmountStr = root.formatAlternativeStr(tx.amount);
    tx.feeStr = root.formatAmountStr(tx.fee || tx.fees);

    return tx;
  };

  return root;
});
