'use strict';

angular.module('copay.addresses').controller('AddressesController',
  function($scope, $rootScope, controllerUtils) {
    $scope.title = 'Home';
    $scope.oneAtATime = true;
    $scope.addrBalance = {};

    var w = $rootScope.wallet;

    var _updateBalance = function () {
      controllerUtils.setSocketHandlers();

      w.getBalance(function (balance, balanceByAddr) {
        if (balanceByAddr  && Object.keys(balanceByAddr).length) {
          $rootScope.balanceByAddr = balanceByAddr;
          $scope.addrs =  Object.keys(balanceByAddr);
          $scope.selectedAddr = $scope.addrs[0];
          $rootScope.$digest();
        }
      });
    };

    $scope.newAddr = function() {
      w.generateAddress();
      _updateBalance();
    };

    $scope.selectAddr = function(addr) {
      $scope.selectedAddr = addr;
    };

    _updateBalance();
    w.on('refresh', _updateBalance);
  });
