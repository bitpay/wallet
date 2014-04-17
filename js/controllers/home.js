'use strict';

angular.module('copay.home').controller('HomeController',
  function($scope, $rootScope, $location) {
    $scope.title = 'Home';

    $scope.oneAtATime = true;
    $scope.addrBalance = {};

    var _getBalance = function() {
      $scope.addrs.forEach(function(addr) {
        $rootScope.wallet.blockchain.listUnspent([addr], function(unspent) {
          var balance = $rootScope.wallet.blockchain.getBalance(unspent);
          $scope.addrBalance[addr] = balance;
          $scope.$digest();
        });
      });
    };

    if (!$rootScope.wallet || !$rootScope.wallet.id) {
      $location.path('signin');
    } else {
      $scope.addrs = $rootScope.wallet.getAddressesStr();
      $scope.selectedAddr = $scope.addrs[0];

      _getBalance();
    }

    $scope.newAddr = function() {
      var a = $rootScope.wallet.generateAddress().toString();
      $scope.addrs.push(a);

      _getBalance();
    };

    $scope.selectAddr = function(addr) {
      $scope.selectedAddr = addr;
    };
  });
