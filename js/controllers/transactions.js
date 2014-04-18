'use strict';
var bitcore = require('bitcore');

angular.module('copay.transactions').controller('TransactionsController',
  function($scope, $rootScope, $location, Socket, controllerUtils) {
    $scope.title = 'Transactions';

    $scope.oneAtATime = true;

    var _updateTxs = function() {
      var w   =$rootScope.wallet;
      var inT = w.getTxProposals();
      var txs  = [];

      inT.forEach(function(i){
        var b   = i.txp.builder;
        var tx  = b.build();
        var one = {
          feeSat: b.feeSat,
        };
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
        one.outs = outs;

        // TOD: check missingSignatures === in al inputs?
        one.missingSignatures = tx.countInputMissingSignatures(0);
        one.signedByUs        = i.signedByUs;
        one.ntxid             = i.ntxid;
        one.creator           = i.txp.creator,
        one.createdTs         = i.txp.createdTs;
        txs.push(one);
      });
      $scope.txs = txs;
    };


    if (!$rootScope.wallet || !$rootScope.wallet.id) {
      $location.path('signin');
    }
    else {
      _updateTxs();
      var w = $rootScope.wallet;
      w.on('refresh',_updateTxs);
      var socket = Socket($scope);
      socket.on('connect', controllerUtils.handleTransactionByAddress($scope));
    }

    $scope.sign = function (ntxid) {
      var w = $rootScope.wallet;
      var ret = w.sign(ntxid);
      _updateTxs();

      var p = w.getTxProposal(ntxid);
      if (p.txp.builder.isFullySigned()) {
        w.sendTx(ntxid, function(txid) {
          $rootScope.flashMessage = txid
            ? {type:'success', message: 'Transactions SENT! txid:' + txid}
            : {type:'error', message: 'There was an error sending the Transaction'}
            ;
        });
      }
      else {
        $rootScope.flashMessage = ret
          ? {type:'success', message: 'Transactions signed'}
          : {type:'error', message: 'There was an error signing the Transaction'}
          ;
      }
      _updateTxs();
    };
  });
