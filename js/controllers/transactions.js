'use strict';

angular.module('copay.transactions').controller('TransactionsController',
  function($scope, $rootScope, controllerUtils) {

    $scope.title = 'Transactions';
    $scope.loading = false;

    $scope.send = function (ntxid) {
      $scope.loading = true;
      $rootScope.txAlertCount = 0;
      var w = $rootScope.wallet;
      w.sendTx(ntxid, function(txid) {
          console.log('[transactions.js.68:txid:] SENTTX CALLBACK',txid); //TODO
          $rootScope.flashMessage = txid
            ? {type:'success', message: 'Transaction broadcasted. txid: ' + txid}
            : {type:'error', message: 'There was an error sending the Transaction'}
            ;
          controllerUtils.updateTxs();
          $scope.loading = false;
          $rootScope.$digest();    
      });
    };

    $scope.sign = function (ntxid) {
      $scope.loading = true;
      var w = $rootScope.wallet;
      var ret = w.sign(ntxid);

      if (!ret) {
        $rootScope.flashMessage = {type:'error', message: 'There was an error signing the Transaction'};
        controllerUtils.updateTxs();
        $scope.loading = false;
        $rootScope.$digest();
        return;
      }
      var p = w.txProposals.getTxProposal(ntxid);
      if (p.builder.isFullySigned()) {
        $scope.send(ntxid);
        controllerUtils.updateTxs();
      }
      else {
        controllerUtils.updateTxs();
        $scope.loading = false;
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
      $rootScope.txAlertCount = 0;
      var w = $rootScope.wallet;
      w.reject(ntxid);
      $rootScope.flashMessage = {type:'warning', message: 'Transaction rejected by you'};
      $scope.loading = false;
    };

  });
