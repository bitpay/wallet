'use strict';

angular.module('copayApp.services').factory('counterpartyService', function(bcpwcService, configService, addressService, lodash, $timeout) {
  var root = {};
  var counterpartyClient = bcpwcService.getClient();

  var CACHED_CONFIRMATIONS_LENGTH = 6;

  root.isEnabled = function() {
    return configService.getSync().counterpartyTokens.enabled;
  }

  root.getBalances = function(address, cb) {
    counterpartyClient.getBalances(address, function(err, balanceEntries) {
      var tokenBalances = [];

      if (!err) {
        var entry;
        for (var i = 0; i < balanceEntries.length; i++) {
          entry = balanceEntries[i];
          tokenBalances.push({
            tokenName:   entry.asset,
            quantity:    entry.quantityFloat,
            quantitySat: entry.quantity,
            divisible:   entry.divisible
          });
        }
      }

      console.log('(cb2) balances for address '+address, tokenBalances);
      cb(err, tokenBalances);
    });
  };


  root.applyCounterpartyDataToTxHistory = function(walletId, txHistory, cb) {
    console.log('applyCounterpartyDataToTxHistory');
    addressService.getAddress(walletId, false, function(err, address) {
      if (err != null) { return cb(err); }

      console.log('applyCounterpartyDataToTxHistory address='+address+' txHistory', txHistory);

      var txIdsForLookup = [];
      for (var i = 0; i < txHistory.length; i++) {
        var txObject = txHistory[i];
        if (isRecentOrUnvalidatedCounterpartyTransaction(txObject)) {
          txIdsForLookup.push(txObject.txid)
        }
      }

      // lookup all txids
      console.log('txIdsForLookup:', txIdsForLookup);
      counterpartyClient.getTransactions(address, txIdsForLookup, function(err, cpTransactions) {
        var cpTxHistory = applyCounterpartyTransactionsToTXHistory(cpTransactions, txHistory)
        console.log('cpTxHistory:', cpTxHistory);
        cb(null, cpTxHistory);
      })


    });
  }

  // ------------------------------------------------------------------------
  
  function isRecentOrUnvalidatedCounterpartyTransaction(txObject) {
    if (txObject.counterparty == null) {
      return true;
    }

    // if counterparty server has validated this with more than 6 confirmations,
    //   treat it as final
    if (txObject.confirmations > CACHED_CONFIRMATIONS_LENGTH && txObject.counterparty.validatedConfirmations > CACHED_CONFIRMATIONS_LENGTH) {
      return false;
    }

    return true;
  }

  function applyCounterpartyTransactionsToTXHistory(cpTransactions, txHistory) {
    var cpTransactionsMap = lodash.indexBy(cpTransactions, function(cpTx) {
      return cpTx.event;
    });

    var cpTxHistory = [];
    for (var i = 0; i < txHistory.length; i++) {
      var txEntry = txHistory[i];
      cpTxHistory.push(applyCounterpartyTransaction(cpTransactionsMap[txEntry.txid], txEntry));
    }

    return cpTxHistory;
  }

  function applyCounterpartyTransaction(cpTransaction, txEntry) {
    var cpData = txEntry.counterparty || {};
    cpData.validatedConfirmations = txEntry.confirmations;
    cpData.isCounterparty = txEntry.counterparty || false;

    if (cpTransaction != null) {
      // found a counterparty transaction - merge it in
      cpData.isCounterparty = true;
      lodash.assign(cpData, cpTransaction);
    } else {
      // did not find this counterparty transaction
      if (isRecentOrUnvalidatedCounterpartyTransaction(txEntry)) {
        cpData.isCounterparty = false;        
      }
    }

    txEntry.counterparty = cpData;
    return txEntry;
  }

  // ------------------------------------------------------------------------
  return root;
});


/*

// insight
{
    action: "received",
    alternativeAmountStr: "0.03 USD",
    amount: 5430,
    amountStr: "0.000054 BTC",
    confirmations: 853,
    creatorName: "",
    feeStr: "0.000163 BTC",
    fees: 16329,
    hasUnconfirmedInputs: false,
    message: null,
    outputs: [],
    safeConfirmed: "6+",
    time: 1470866515,
    txid: "278f8bf8b3ecfee1cd6c064c06efed31f2e197e0b6e30ad71f24503aca4acc12"
}

// counterparty
{
    "address": "1Aq4MVsUzPNQsKmiLL9Fy2pKvfJ9WWkStw",
    "asset": "SOUP",
    "block_index": 424615,
    "calling_function": "send",
    "direction": "credit",
    "divisible": true,
    "event": "278f8bf8b3ecfee1cd6c064c06efed31f2e197e0b6e30ad71f24503aca4acc12",
    "quantity": 510000000,
    "quantityFloat": 5.1
}

*/