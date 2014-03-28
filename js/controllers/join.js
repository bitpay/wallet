'use strict';

angular.module('copay.join').controller('JoinController',
  function($scope, $rootScope, $routeParams, Network) {

    $scope.connectionId = $routeParams.id;
    $scope.copayers = [];

    $scope.init = function() {
      console.log('-------- init --------');
      console.log($rootScope.peerId);
      $scope.copayers.push($rootScope.peerId);

      Network.connect($scope.connectionId, function(copayer) {
        console.log('----- join connect --------');
        console.log(copayer);
        $scope.copayers.push(copayer);
        $scope.$digest();
      });
    };
  });
