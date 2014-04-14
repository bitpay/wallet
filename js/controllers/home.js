'use strict';

angular.module('copay.home').controller('HomeController',
  function($scope, $rootScope, $location) {
    $scope.title = 'Home';

    $scope.oneAtATime = true;

    if (!$rootScope.peerId) {
      $location.path('signin');
    }

    $scope.addrs = $rootScope.publicKeyRing.getAddresses();
    $scope.selectedAddr = $scope.addrs[0];

    $scope.newAddr = function() {
      var a = $rootScope.publicKeyRing.generateAddress();
      $scope.addrs.push({ addrStr: a.toString('hex') });
    };

    $scope.selectAddr = function(addr) {
      $scope.selectedAddr = addr;
    };
  });
