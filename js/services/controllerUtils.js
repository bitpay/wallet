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
      root.updateBalance();
    });
    w.on('refresh', function() {
      console.log('[controllerUtils.js] Refreshing'); //TODO
      root.updateBalance();
    });
    w.on('openError', root.onErrorDigest);
    w.on('close', root.onErrorDigest);
    w.netStart();
  };

  root.updateBalance = function() {
    var w = $rootScope.wallet;
    w.getBalance(false,function(balance, balanceByAddr) {
      $rootScope.totalBalance = balance;
      $rootScope.balanceByAddr = balanceByAddr;
      console.log('New balance:', balance);
      w.getBalance(true,function(balance) {
        $rootScope.availableBalance = balance;
        $rootScope.$digest();
      });
    });
  };

  root.setSocketHandlers = function() {
    Socket.removeAllListeners();

    var addrs = $rootScope.wallet.getAddressesStr();
    for(var i = 0; i < addrs.length; i++) {
      console.log('### SUBSCRIBE TO', addrs[i]);
      Socket.emit('subscribe', addrs[i]);
    }

    addrs.forEach(function(addr) {
      Socket.on(addr, function(txid) {
        console.log('Received!', txid);
        root.updateBalance();
      });
    });
  };

  return root;
});

