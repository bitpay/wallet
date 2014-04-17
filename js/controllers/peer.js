'use strict';

angular.module('copay.peer').controller('PeerController',
  function($scope, $rootScope, $location, $routeParams, Socket) {
    
    $scope.init = function() {
      //Network.connect($rootScope.masterId);
    };

    var socket = Socket($scope);
    socket.on('connect', function() {
      var addrs = $rootScope.wallet.getAddressesStr();
      socket.emit('subscribe', 'inv');
      for(var i=0;i<addrs.length;i++) {
        socket.emit('subscribe', addrs[i]);
      }
      addrs.forEach(function(addr) {
        socket.on(addr, function(txid) {
          console.log('Received!', txid);
          $rootScope.wallet.getBalance(function(balance) {
            $scope.$apply(function() {
              $rootScope.totalBalance = balance;
            });
            console.log('New balance:', balance);
          });
        });
      });
    });
    
  });

