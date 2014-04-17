'use strict';

angular.module('copay.controllerUtils').factory('controllerUtils', function ($rootScope, $location, Socket) {
  var root = {};
  root.setupUxHandlers =  function(w) {
    w.on('created', function() {
      $location.path('peer');
      $rootScope.wallet = w;
      
      // Initial getBalance
      $rootScope.wallet.getTotalBalance(function(balance) {
        $rootScope.totalBalance = balance;
        $rootScope.$digest();
      });
    });
    w.on('refresh', function() {
      console.log('[controllerUtils.js] RECEIVED REFRESH'); //TODO
    });

    w.on('openError', function(){
      $scope.loading = false;
      $rootScope.flashMessage = {type:'error', message: 'Wallet not found'};
      $location.path('signin');
    });
  };

  root.handleTransactionByAddress = function(scope) {
    var socket = Socket(scope);
    var addrs = $rootScope.wallet.getAddressesStr();
    socket.emit('subscribe', 'inv');
    for(var i=0;i<addrs.length;i++) {
      socket.emit('subscribe', addrs[i]);
    }
    addrs.forEach(function(addr) {
      socket.on(addr, function(txid) {
        console.log('Received!', txid);
        $rootScope.wallet.getTotalBalance(function(balance) {
          scope.$apply(function() {
            $rootScope.totalBalance = balance;
          });
          console.log('New balance:', balance);
        });
      });
    });
  };

  return root;
});

