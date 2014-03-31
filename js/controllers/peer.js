'use strict';

angular.module('copay.peer').controller('PeerController',
  function($scope, $rootScope, $location, $routeParams, Network) {
    
    $scope.init = function() {
      console.log('connecting peer init');
      //Network.connect($rootScope.masterId);
    };
  });

