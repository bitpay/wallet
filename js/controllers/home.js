'use strict';

angular.module('cosign.home').controller('HomeController',
  function($scope, $rootScope, $location) {
    $scope.title = 'Home';

    $scope.addrs = [
    { addrStr: 'n3zUqNR7Bbbc4zJhPVj1vG2Lx66K3Xhzvb'},
    { addrStr: 'my9wnLwwUrwpNfEgSrWY62ymEGf1edKf4J'}
    ];
  });
