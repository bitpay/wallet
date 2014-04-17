'use strict';

angular.module('copay.backup').controller('BackupController',
  function($scope, $rootScope, $location, Socket, controllerUtils) {

    if (!$rootScope.wallet || !$rootScope.wallet.id) {
      $location.path('signin');
    }
    else {
      var socket = Socket($scope);
      socket.on('connect', controllerUtils.handleTransactionByAddress($scope));
    }

    $scope.title = 'Backup';
  });
