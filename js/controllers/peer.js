'use strict';

angular.module('copay.peer').controller('PeerController',
  function($scope, $rootScope, $location, $routeParams, Socket, controllerUtils) {
    controllerUtils.handleTransactionByAddress($scope);
  });

