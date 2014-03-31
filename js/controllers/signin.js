'use strict';

angular.module('cosign.signin').controller('SigninController',
  function($scope, $rootScope, $location, Network) {

    // Init peer
    Network.init();

    $scope.join = function(cid) {
      console.log('------- joining to ' + cid +  ' --------');

      var pid = cid || $rootScope.peerId;
      $location.path('join/' + pid);
    };
  });
