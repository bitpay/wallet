'use strict';

angular.module('copay.peer').controller('PeerController',
  function($scope, $rootScope, $location, $routeParams, Network) {
    
    $scope.init = function() {
      Network.connect($rootScope.connectionId, function(copayer) {
        console.log(copayer);
        console.log($rootScope.copayers);
      });
    };
  });

