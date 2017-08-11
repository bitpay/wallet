'use strict';

angular.module('copayApp.services').factory('txFormatService', function($filter, bwcService, rateService, configService, lodash, networkService) {
  var root = {};

  root.Utils = bwcService.getUtils();


  root.formatAmount = function(networkURI, atomics, fullPrecision) {
    var config = configService.getSync().currencyNetworks[networkURI];
    if (config.unitCode == config.atomicUnitCode) return atomics;

    //TODO : now only works for english, specify opts to change thousand separator and decimal separator
    var opts = {
      fullPrecision: !!fullPrecision
    };
    return this.Utils.formatAmount(atomics, config.unitCode, opts);
  };

  root.formatAmountStr = function(networkURI, atomics) {
    if (isNaN(atomics)) return;
    var config = configService.getSync().currencyNetworks[networkURI];
    return root.formatAmount(networkURI, atomics) + ' ' + config.unitName;
  };

  root.toFiat = function(networkURI, atomics, code, cb) {
    if (isNaN(atomics)) return;
    var val = function() {
      var v1 = rateService.toFiat(networkURI, atomics, code);
      if (!v1) return null;

      return v1.toFixed(2);
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

  root.formatToUSD = function(networkURI, atomics, cb) {
    if (isNaN(atomics)) return;
    var val = function() {
      var v1 = rateService.toFiat(networkURI, atomics, 'USD');
      if (!v1) return null;

      return v1.toFixed(2);
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

  root.formatAlternativeStr = function(networkURI, atomics, cb) {
    if (isNaN(atomics)) return;
    var config = configService.getSync().currencyNetworks[networkURI];

    var val = function() {
      var v1 = parseFloat((rateService.toFiat(networkURI, atomics, config.alternativeIsoCode)).toFixed(2));
      v1 = $filter('formatFiatAmount')(v1);
      if (!v1) return null;

      return v1 + ' ' + config.alternativeIsoCode;
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
          o.amountStr = root.formatAmountStr(tx.network, o.amount);
          o.alternativeAmountStr = root.formatAlternativeStr(tx.network, o.amount);
          return total + o.amount;
        }, 0);
      }
      tx.toAddress = tx.outputs[0].toAddress;
    }

    tx.amountStr = root.formatAmountStr(tx.network, tx.amount);
    tx.alternativeAmountStr = root.formatAlternativeStr(tx.network, tx.amount);
    tx.feeStr = root.formatAmountStr(tx.network, tx.fee || tx.fees);

    if (tx.amountStr) {
      tx.amountValueStr = tx.amountStr.split(' ')[0];
      tx.amountAtomicStr = tx.amountStr.split(' ')[1];
    }

    return tx;
  };

  root.formatPendingTxps = function(txps) {
    $scope.pendingTxProposalsCountForUs = 0;
    var now = Math.floor(Date.now() / 1000);

    /* To test multiple outputs...
    var txp = {
      message: 'test multi-output',
      fee: 1000,
      createdOn: new Date() / 1000,
      outputs: []
    };
    function addOutput(n) {
      txp.outputs.push({
        amount: 600,
        toAddress: '2N8bhEwbKtMvR2jqMRcTCQqzHP6zXGToXcK',
        message: 'output #' + (Number(n) + 1)
      });
    };
    lodash.times(150, addOutput);
    txps.push(txp);
    */

    lodash.each(txps, function(tx) {

      tx = txFormatService.processTx(tx);

      // no future transactions...
      if (tx.createdOn > now)
        tx.createdOn = now;

      tx.wallet = profileService.getWallet(tx.walletId);
      if (!tx.wallet) {
        $log.error("no wallet at txp?");
        return;
      }

      var action = lodash.find(tx.actions, {
        copayerId: tx.wallet.copayerId
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

      if (!tx.deleteLockTime)
        tx.canBeRemoved = true;
    });

    return txps;
  };

  root.parseAmount = function(networkURI, amount, currency) {
    var config = configService.getSync().currencyNetworks[networkURI];
    var unitToAtomicUnit = config.unitToAtomicUnit;
    var atomicToUnit = 1 / unitToAtomicUnit;
    var amountAtomicStr;
    var amountAtomic;
    var alternativeIsoCode = config.alternativeIsoCode;

    var networkUnits = networkService.getNetworkByURI(networkURI).units;
    var foundCurrencyName = lodash.find(networkUnits, function(u) {
      return u.shortName == currency;
    });

    var atomicUnit = networkService.getAtomicUnit(networkURI);
    var standardUnit = networkService.getStandardUnit(networkURI);

    if (!foundCurrencyName) { // Alternate currency
      amountAtomic = rateService.fromFiat(networkURI, amount, currency).toFixed(atomicUnit.decimals);
      amountAtomicStr = $filter('formatFiatAmount')(amount) + ' ' + currency;

    } else if (currency == atomicUnit.shortName) { // Atomic
      amountAtomic = amount;
      amountAtomicStr = root.formatAmountStr(networkURI, amountAtomic);
      // convert atomics to standard
      amount = (amountAtomic * atomicToUnit).toFixed(standardUnit.decimals);
      currency = standardUnit.shortName;

    } else if (currency == standardUnit.shortName) { // Standard
      amountAtomic = parseInt((amount * unitToAtomicUnit).toFixed(atomicUnit.decimals));
      amountAtomicStr = root.formatAmountStr(networkURI, amountAtomic);
      // convert atomics to standard
      amount = (amountAtomic * atomicToUnit).toFixed(standardUnit.decimals);
      currency = standardUnit.shortName;
    }

    return {
      amount: amount,
      currency: currency,
      alternativeIsoCode: alternativeIsoCode,
      amountAtomic: amountAtomic,
      amountAtomicStr: amountAtomicStr
    };
  };

  root.atomicToUnit = function(networkURI, amount) {
    var config = configService.getSync().currencyNetworks[networkURI];
    var unitToAtomicUnit = config.unitToAtomicUnit;
    var atomicToUnit = 1 / unitToAtomicUnit;
    var unitDecimals = config.unitDecimals;
    return parseFloat((amount * atomicToUnit).toFixed(unitDecimals));
  };

  return root;
});
