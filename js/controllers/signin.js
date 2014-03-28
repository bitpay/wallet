'use strict';

angular.module('copay.signin').controller('SigninController',
  function($scope, $rootScope, $location, Network) {
    $rootScope.peerId = null;
    $scope.peerReady = false;

    // Init peer
    Network.init(function(pid) {
      $rootScope.peerId = pid;
      $rootScope.$digest();

      $scope.peerReady = true;
      $scope.$digest();
    });

    $scope.join = function(cid) {
      console.log('------- join --------');
      console.log(cid);

      var pid = cid || $rootScope.peerId;
      $location.path('join/' + pid);
    };
  });
