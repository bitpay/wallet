'use strict';

angular.module('cosign.join').controller('JoinController',
  function($scope, $rootScope, $routeParams, Network) {
    $rootScope.masterId = $routeParams.id;

    $scope.init = function() {
      console.log('-------- init --------');
      console.log($rootScope.peerId);

      Network.connect($rootScope.masterId);
    };
  });
