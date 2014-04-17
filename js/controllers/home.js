'use strict';

angular.module('copay.home').controller('HomeController',
  function($scope, $rootScope, $location) {
    $scope.title = 'Home';

    $scope.oneAtATime = true;

    if (!$rootScope.wallet || !$rootScope.wallet.id) {
      $location.path('signin');
    }
    else {
      $scope.addrs = $rootScope.wallet.getAddressesStr();
      $scope.selectedAddr = $scope.addrs[0];
    }

    $scope.newAddr = function() {
console.log('[home.js.17:newAddr:]'); //TODO
      var a = $rootScope.wallet.generateAddress();
console.log('[home.js.19]',a); //TODO
      $scope.addrs.push(a.toString());
    };

    $scope.selectAddr = function(addr) {
      $scope.selectedAddr = addr;
    };
  });
