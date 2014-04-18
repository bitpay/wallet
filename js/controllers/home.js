'use strict';

angular.module('copay.home').controller('HomeController',
  function($scope, $rootScope, controllerUtils) {
    $scope.title = 'Home';
    $scope.oneAtATime = true;
    $scope.addrBalance = {};

    var w = $rootScope.wallet;

    var _updateBalance = function () {
      w.getBalance(function (balance, balanceByAddr) {
        $rootScope.$apply(function() {
          $rootScope.balanceByAddr = balanceByAddr;
          $scope.addrs =  Object.keys(balanceByAddr);
          $scope.selectedAddr = $scope.addrs[0];
        });
      });
    };

    $scope.newAddr = function() {
      w.generateAddress().toString();
      _updateBalance();

      controllerUtils.setSocketHandlers();
    };

    $scope.selectAddr = function(addr) {
      $scope.selectedAddr = addr;
    };

    _updateBalance();
  });
