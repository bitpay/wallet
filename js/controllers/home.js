'use strict';

angular.module('copay.home').controller('HomeController',
  function($scope, $rootScope, $location, Socket, controllerUtils) {
    $scope.title = 'Home';
    $scope.oneAtATime = true;
    $scope.addrBalance = {};

    var w = $rootScope.wallet;

    var _updateBalance = function () {
      w.getBalance(function (balance, balanceByAddr) {
        if (balanceByAddr  && Object.keys(balanceByAddr).length) {
          $scope.balanceByAddr = balanceByAddr;
          $scope.addrs =  Object.keys(balanceByAddr);
          $scope.selectedAddr = $scope.addrs[0];
          $scope.$digest();
        }
      });
      var socket = Socket($scope);
      controllerUtils.handleTransactionByAddress($scope, _updateBalance);
    };

    $scope.newAddr = function() {
      var a = w.generateAddress().toString();
      _updateBalance();
    };

    $scope.selectAddr = function(addr) {
      $scope.selectedAddr = addr;
    };

    
    if (!$rootScope.wallet || !$rootScope.wallet.id) {
      $location.path('signin');
    }
    _updateBalance();
    w.on('refresh',_updateBalance);
  });
