'use strict';

angular.module('copay.home').controller('HomeController',
  function($scope, $rootScope, $location, Socket, controllerUtils) {
    $scope.title = 'Home';

    $scope.oneAtATime = true;
    $scope.addrBalance = {};
    
    var _getBalance = function() {
      $scope.addrs.forEach(function(addr) {
        $rootScope.wallet.getBalance([addr], function(balance) {
          $scope.addrBalance[addr] = balance;
          $scope.$digest();
        });
      });
    };

    if (!$rootScope.wallet || !$rootScope.wallet.id) {
      $location.path('signin');
    } else {
      $scope.addrs = $rootScope.wallet.getAddressesStr(true);
      $scope.selectedAddr = $scope.addrs[0];

      _getBalance();

      var socket = Socket($scope);
      socket.on('connect', controllerUtils.handleTransactionByAddress($scope));
    }

    $scope.newAddr = function() {
      var a = $rootScope.wallet.generateAddress().toString();
      $scope.addrs.push(a);
      _getBalance();
      var socket = Socket($scope);
      socket.on('connect', controllerUtils.handleTransactionByAddress($scope));
    };

    $scope.selectAddr = function(addr) {
      $scope.selectedAddr = addr;
    };
  });
