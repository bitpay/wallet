'use strict';

angular.module('copay.transactions').controller('TransactionsController',
  function($scope, $rootScope, $location) {
    var bitcore = require('bitcore');

    $scope.title = 'Transactions';
    $scope.loading = false;



    var _updateTxs = function() {
      var w   =$rootScope.wallet;
      if (!w) return;

      var inT = w.getTxProposals();
      var txs  = [];

      inT.forEach(function(i){
        var tx  = i.builder.build();
        var outs = [];

        tx.outs.forEach(function(o) {
          var addr = bitcore.Address.fromScriptPubKey(o.getScript(), config.networkName)[0].toString();
          if (!w.addressIsOwn(addr, {excludeMain:true})) {
            outs.push({
              address: addr, 
              value: bitcore.util.valueToBigInt(o.getValue())/bitcore.util.COIN,
            });
          }
        });
        // extra fields
        i.outs = outs;
        i.fee = i.builder.feeSat/bitcore.util.COIN;
        i.missingSignatures = tx.countInputMissingSignatures(0);
        txs.push(i);
      });
      $scope.txs = txs;
      w.removeListener('txProposalsUpdated',_updateTxs)
      w.once('txProposalsUpdated',_updateTxs);
      $scope.loading = false;
    };

    $scope.send = function (ntxid) {
      $scope.loading = true;
      var w = $rootScope.wallet;
      w.sendTx(ntxid, function(txid) {
          console.log('[transactions.js.68:txid:] SENTTX CALLBACK',txid); //TODO
          $rootScope.flashMessage = txid
            ? {type:'success', message: 'Transaction broadcasted. txid: ' + txid}
            : {type:'error', message: 'There was an error sending the Transaction'}
            ;
          _updateTxs();
          $rootScope.$digest();    
      });
    };

    $scope.sign = function (ntxid) {
      $scope.loading = true;
      var w = $rootScope.wallet;
      var ret = w.sign(ntxid);

      if (!ret) {
        $rootScope.flashMessage = {type:'error', message: 'There was an error signing the Transaction'};
        _updateTxs();
        $rootScope.$digest();    
        return;
      }
      var p = w.txProposals.getTxProposal(ntxid);
      if (p.builder.isFullySigned()) {
        $scope.send(ntxid);
        _updateTxs();
      }
      else {
        _updateTxs();
        $rootScope.$digest();    
      }
    };

    $scope.getTransactions = function() {
      var w   =$rootScope.wallet;
      if (w) {
        var addresses = w.getAddressesStr();

        if (addresses.length > 0) {
          w.blockchain.getTransactions(addresses, function(txs) {
            $scope.blockchain_txs = txs;
            $rootScope.$digest();
          });
        }
      }
    };

    $scope.getShortNetworkName = function() {
      return config.networkName.substring(0,4);
    };

    $scope.reject = function (ntxid) {
      $scope.loading = true;
      var w = $rootScope.wallet;
      w.reject(ntxid);
      $rootScope.flashMessage = {type:'warning', message: 'Transaction rejected by you'};
      _updateTxs();
//      $rootScope.$digest();    
    };

    _updateTxs();

    var w = $rootScope.wallet;
    if (w) {
      w.on('txProposalsUpdated', function() {
        console.log('[transactions.js.108: txProposalsUpdated:]'); //TODO
        _updateTxs();
        $rootScope.$digest();    
      });
    }
  });
