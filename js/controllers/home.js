'use strict';

angular.module('copay.home').controller('HomeController',
  function($scope, $rootScope) {

    $scope.title = 'Home';

    $scope.oneAtATime = true;

    if (!$rootScope.peerId) {
      $location.path('signin');
    }

    $scope.addrs = $rootScope.publicKeyRing.getAddresses();

    // by default select the first address
    $scope.selectedQR = $scope.addrs[0];

    $scope.changeQR = function(addr) {
      $scope.selectedQR = addr;
    };

    $scope.newAddress = function() {
      var a = $rootScope.publicKeyRing.generateAddress();
      $scope.addrs.push({ addrStr: a.toString('hex') });
    };
  });
