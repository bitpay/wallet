'use strict';

angular.module('copay.transactions').controller('TransactionsController',
  function($scope, $rootScope, $location, Socket, controllerUtils) {
    $scope.title = 'Transactions';

    $scope.oneAtATime = true;

    var _updateTxs = function() {
      var w   =$rootScope.wallet;
      var inT = w.getTxProposals();
      var ts  = [];

      inT.forEach(function(i){
        var b   = i.txp.builder;
        var tx  = b.build();
        var one = {
          valueOutSat: b.valueOutSat,
          feeSat: b.feeSat,
        };
        var outs = [];
        var bitcore = require('bitcore');
        tx.outs.forEach(function(o) {
          var s = o.getScript();
          var aStr = bitcore.Address.fromScript(s, config.networkName).toString();
          if (!w.addressIsOwn(aStr))
            outs.push({address: aStr, value: bitcore.util.valueToBigInt(o.getValue())});
        });
        one.outs = outs;
        ts.push(one);
      });
      $scope.txs = ts;
    };


    if (!$rootScope.wallet || !$rootScope.wallet.id) {
      $location.path('signin');
    }
    else {
      _updateTxs();
      var socket = Socket($scope);
      socket.on('connect', controllerUtils.handleTransactionByAddress($scope));
    }

    $scope.sign = function (ntxid) {
      var w = $rootScope.wallet;
      var ret = w.sign(ntxid);
      $rootScope.flashMessage = {type:'success', message: 'Transactions SEND! : ' + ret};
      _updateTxs();
    };
  });
