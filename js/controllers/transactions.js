'use strict';
var bitcore = require('bitcore');

angular.module('copayApp.controllers').controller('TransactionsController',
  function($scope, $rootScope, $timeout, controllerUtils) {

    $scope.title = 'Transactions';
    $scope.loading = false;
    $scope.onlyPending = true;
    $scope.lastShowed = false;

    $scope.txpCurrentPage = 1;
    $scope.txpItemsPerPage = 4;
    $scope.blockchain_txs = [];

    $scope.update = function () {
      $scope.loading = false;
      var from = ($scope.txpCurrentPage-1) * $scope.txpItemsPerPage;
      var opts = {
        onlyPending: $scope.onlyPending,
        skip: !$scope.onlyPending ? [from, from + $scope.txpItemsPerPage] : null
      };
      controllerUtils.updateTxs(opts);
      $rootScope.$digest();
    };

    $scope.show = function (onlyPending) {
      $scope.loading=true;
      $scope.onlyPending = onlyPending;
      setTimeout(function(){
        $scope.update();
      }, 10);
    };

    var _aggregateItems = function(items) {
      if (!items) return [];

      var l = items.length;

      var ret = [];
      var tmp = {};
      var u = 0;

      for(var i=0; i < l; i++) {

        var notAddr = false;
        // non standard input
        if (items[i].scriptSig && !items[i].addr) {
          items[i].addr = 'Unparsed address [' + u++ + ']';
          items[i].notAddr = true;
          notAddr = true;
        }

        // non standard output
        if (items[i].scriptPubKey && !items[i].scriptPubKey.addresses) {
          items[i].scriptPubKey.addresses = ['Unparsed address [' + u++ + ']'];
          items[i].notAddr = true;
          notAddr = true;
        }

        // multiple addr at output
        if (items[i].scriptPubKey && items[i].scriptPubKey.addresses.length > 1) {
          items[i].addr = items[i].scriptPubKey.addresses.join(',');
          ret.push(items[i]);
          continue;
        }

        var addr = items[i].addr || (items[i].scriptPubKey && items[i].scriptPubKey.addresses[0]);

        if (!tmp[addr]) {
          tmp[addr] = {};
          tmp[addr].valueSat = 0;
          tmp[addr].count = 0;
          tmp[addr].addr = addr;
          tmp[addr].items = [];
        }
        tmp[addr].isSpent = items[i].spentTxId;

        tmp[addr].doubleSpentTxID = tmp[addr].doubleSpentTxID   || items[i].doubleSpentTxID;
        tmp[addr].doubleSpentIndex = tmp[addr].doubleSpentIndex || items[i].doubleSpentIndex;
        tmp[addr].unconfirmedInput += items[i].unconfirmedInput;
        tmp[addr].dbError = tmp[addr].dbError || items[i].dbError;
        tmp[addr].valueSat += (items[i].value * bitcore.util.COIN)|0;
        tmp[addr].items.push(items[i]);
        tmp[addr].notAddr = notAddr;
        tmp[addr].count++;
      }

      angular.forEach(tmp, function(v) {
        v.value    = (v.valueSat|0) / bitcore.util.BIT;
        ret.push(v);
      });
      return ret;
    };

    $scope.toogleLast = function () {
      $scope.lastShowed = !$scope.lastShowed;
      if ($scope.lastShowed) {
        $scope.getTransactions();
      }
    };

    $scope.send = function (ntxid,cb) {
      $scope.loading = true;
      $rootScope.txAlertCount = 0;
      var w = $rootScope.wallet;
      w.sendTx(ntxid, function(txid) {
          $rootScope.$flashMessage = txid
            ? {type:'success', message: 'Transaction broadcasted. txid: ' + txid}
            : {type:'error', message: 'There was an error sending the Transaction'}
            ;
          if (cb) return cb();
          else $scope.update();
      });
    };

    $scope.sign = function (ntxid) {
      $scope.loading = true;
      var w = $rootScope.wallet;
      w.sign(ntxid, function(ret){
        if (!ret) {
          $rootScope.$flashMessage = {
            type:'error',
            message: 'There was an error signing the Transaction',
          };
            $scope.update();
        } else {
          var p = w.txProposals.getTxProposal(ntxid);
          if (p.builder.isFullySigned()) {
            $scope.send(ntxid, function() {
              $scope.update();
            });
          }
          else 
            $scope.update();
        }
      });
    };

    $scope.getTransactions = function() {
      var w = $rootScope.wallet;
      $scope.loading = true;
      if (w) {
        var addresses = w.getAddressesStr();
        if (addresses.length > 0) {
          $scope.blockchain_txs = [];
          w.blockchain.getTransactions(addresses, function(txs) { 
            $timeout(function() {
              for (var i=0; i<txs.length;i++) {
                txs[i].vinSimple = _aggregateItems(txs[i].vin);
                txs[i].voutSimple = _aggregateItems(txs[i].vout);
                txs[i].valueOut = ((txs[i].valueOut * bitcore.util.COIN)|0)  / bitcore.util.BIT;
                txs[i].fees = ((txs[i].fees * bitcore.util.COIN)|0)  / bitcore.util.BIT;
                $scope.blockchain_txs.push(txs[i]);
              }
              $scope.loading = false;
            }, 10);
          });
        }
        else {
          $timeout(function() {
            $scope.loading = false;
            $scope.lastShowed = false;
          }, 1);
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
      $rootScope.$flashMessage = {type:'warning', message: 'Transaction rejected by you'};
      $scope.loading = false;
    };

  });
