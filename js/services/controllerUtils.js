'use strict';

angular.module('copay.controllerUtils').factory('controllerUtils', function ($rootScope, $location, Socket) {
  var root = {};

  root.logout = function(scope) {
    delete $rootScope['wallet'];
    $rootScope.totalBalance = 0;
    $location.path('signin');
  };

  root.onError = function(scope) {
    if (scope) scope.loading = false;
    $rootScope.flashMessage = {type:'error', message: 'Could not connect to peer'};
    root.logout();
  }


  root.onErrorDigest = function(scope) {
    root.onError(scope);
    $rootScope.$digest();
  }


  root.setupUxHandlers =  function(w) {

    w.on('badMessage', function(peerId) {
      $rootScope.flashMessage = {type:'error', message: 'Received wrong message from peer id:' + peerId};
    });

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
      console.log('[controllerUtils.js] Refreshing'); //TODO
      // Do not use $digest() here.
    });
    w.on('openError', root.onErrorDigest);
    w.on('close', root.onErrorDigest);
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

