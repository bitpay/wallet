'use strict';

angular.module('copay.addresses').controller('AddressesController',
  function($scope, $rootScope, controllerUtils) {
    $scope.title = 'Home';
    $scope.addrBalance = {};

    var w = $rootScope.wallet;

    var _updateBalance = function() {
      $scope.addrs = w.getAddressesStr(true);
      controllerUtils.setSocketHandlers();
      w.getBalance(true, function(balance, balanceByAddr, isMain) {
        if (balanceByAddr && Object.keys(balanceByAddr).length) {
          $rootScope.balanceByAddr = balanceByAddr;
          $scope.isMain = isMain;
          $scope.addrs = Object.keys(balanceByAddr);
          $scope.selectedAddr = $scope.addrs[0];
          $scope.loading = false;
          $rootScope.$digest();
          alert('digest');
        }
      });
    };

    $scope.newAddr = function() {
      $scope.loading = true;
      w.generateAddress();
      _updateBalance();
      alert('new address');
    };

    $scope.selectAddr = function(addr) {
      $scope.selectedAddr = addr;
    };

    _updateBalance();
    w.on('refresh', _updateBalance);
  });
