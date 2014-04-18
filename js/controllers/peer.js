'use strict';

angular.module('copay.peer').controller('PeerController',
  function($scope, $rootScope, $location, $routeParams, Socket, controllerUtils) {
    
    $scope.init = function() {
      //Network.connect($rootScope.masterId);
    };

    controllerUtils.handleTransactionByAddress($scope);
  });

