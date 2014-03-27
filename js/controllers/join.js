'use strict';

angular.module('cosign.join').controller('JoinController',
  function($scope, $rootScope, $routeParams, Network) {

    $scope.connectionId = $routeParams.id;
    $scope.cosigners = [];

    $scope.init = function() {
      console.log('-------- init --------');
      console.log($rootScope.peerId);
      $scope.cosigners.push($rootScope.peerId);

      Network.connect($scope.connectionId, function(cosigner) {
        console.log('----- join connect --------');
        console.log(cosigner);
        $scope.cosigners.push(cosigner);
        $scope.$digest();
      });
    };
  });
