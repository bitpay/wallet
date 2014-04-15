'use strict';

angular.module('copay.home').controller('HomeController',
  function($scope, $rootScope, $location) {
    $scope.title = 'Home';

    $scope.oneAtATime = true;

    if (!$rootScope.wallet || !$rootScope.wallet.id) {
      $location.path('signin');
    }
    else {
      $scope.addrs = $rootScope.wallet.publicKeyRing.getAddresses();
      $scope.selectedAddr = $scope.addrs[0];
    }

    $scope.newAddr = function() {
      var a = $rootScope.wallet.generateAddress();
      $scope.addrs.push({ addrStr: a.toString('hex') });
    };

    $scope.selectAddr = function(addr) {
      $scope.selectedAddr = addr;
    };
  });
