'use strict';

angular.module('copay.peer').controller('PeerController',
  function($scope, $rootScope, $location, $routeParams, Network) {
    
    $scope.init = function() {
      //Network.connect($rootScope.masterId);
    };
  });

