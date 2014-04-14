'use strict';

angular.module('copay.home').controller('HomeController',
  function($scope, $rootScope) {

    $scope.title = 'Home';

    $scope.oneAtATime = true;

    if (!$rootScope.peerId) {
      $location.path('signin');
    }

//     $scope.addrs = [
//       { addrStr: 'n3zUqNR7Bbbc4zJhPVj1vG2Lx66K3Xhzvb'},
//       { addrStr: 'my9wnLwwUrwpNfEgSrWY62ymEGf1edKf4J'}
//     ];

    $scope.addrs = $rootScope.PublicKeyRing.getAddresses();
    console.log('########################');
    console.log($scope.addrs);

    // by default select the first address
    $scope.selectedQR = $scope.addrs[0];

    $scope.changeQR = function(addr) {
      $scope.selectedQR = addr;
    };

    $scope.newAddress = function() {
      var a = $rootScope.PublicKeyRing.generateAddress();
      console.log(a);
      $scope.addrs.push({ addrStr: a });
    };
  });
