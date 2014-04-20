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
console.log('[controllerUtils.js.30:created:] RECV '); //TODO
      $location.path('peer');
      $rootScope.wallet = w;
      
      $rootScope.wallet.getBalance(function(balance) {
        $rootScope.totalBalance = balance;
      });
    });
    w.on('refresh', function() {
      console.log('[controllerUtils.js] Refreshing'); //TODO
      $rootScope.$digest();
    });
    w.on('openError', root.onErrorDigest);
    w.on('close', root.onErrorDigest);

console.log('[controllerUtils.js.45] CALLING NETSTART FROM setupUxHandlers'); //TODO
    w.netStart();
console.log('[controllerUtils.js.45] setupUxHandlers END'); //TODO
  };

  root.handleTransactionByAddress = function(scope, cb) {
    var socket = Socket(scope);
    var addrs = $rootScope.wallet.getAddressesStr();
    for(var i=0;i<addrs.length;i++) {
      socket.emit('subscribe', addrs[i]);
    }
    addrs.forEach(function(addr) {
      socket.on(addr, function(txid) {
        console.log('Received!', txid);
        $rootScope.wallet.getBalance(function(balance) {
          scope.$apply(function() {
            $rootScope.totalBalance = balance;
          });
          console.log('New balance:', balance);
          if (typeof cb === 'function') return cb();
        });
      });
    });
  };

  return root;
});

