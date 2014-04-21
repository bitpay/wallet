'use strict';
var bitcore = require('bitcore');

angular.module('copay.transactions').controller('TransactionsController',
  function($scope, $rootScope, $location) {
    $scope.title = 'Transactions';

    $scope.oneAtATime = true;

    var _updateTxs = function() {
console.log('[transactions.js.10:_updateTxs:]'); //TODO
      var w   =$rootScope.wallet;
      var inT = w.getTxProposals();
      var txs  = [];

      inT.forEach(function(i){
        var tx  = i.builder.build();
        var outs = [];

        tx.outs.forEach(function(o) {
          var addr = bitcore.Address.fromScriptPubKey(o.getScript(), config.networkName)[0].toString();
          if (!w.addressIsOwn(addr)) {
            outs.push({
              address: addr, 
              value: bitcore.util.valueToBigInt(o.getValue())/bitcore.util.COIN,
            });
          }
        });
        // extra fields
        i.outs = outs;
        i.fee = i.feeSat/bitcore.util.COIN;
        i.missingSignatures = tx.countInputMissingSignatures(0);
        txs.push(i);
      });
      $scope.txs = txs;
      w.removeListener('txProposalsUpdated',_updateTxs)
      w.once('txProposalsUpdated',_updateTxs);
    };

    $scope.send = function (ntxid) {
      var w = $rootScope.wallet;
      w.sendTx(ntxid, function(txid) {
console.log('[transactions.js.68:txid:] SENTTX CALLBACK',txid); //TODO
          $rootScope.flashMessage = txid
            ? {type:'success', message: 'Transactions SENT! txid:' + txid}
            : {type:'error', message: 'There was an error sending the Transaction'}
            ;
          _updateTxs();
          $rootScope.$digest();    
      });
    };

    $scope.sign = function (ntxid) {
      var w = $rootScope.wallet;
      var ret = w.sign(ntxid);
      _updateTxs();

      var p = w.getTxProposal(ntxid);
      if (p.txp.builder.isFullySigned()) {
        $scope.send(ntxid);
      }
      else {
        $rootScope.flashMessage = ret
          ? {type:'success', message: 'Transactions signed'}
          : {type:'error', message: 'There was an error signing the Transaction'}
          ;
        _updateTxs();
        $rootScope.$digest();    
      }
    };

  });
