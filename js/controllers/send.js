'use strict';

angular.module('copay.send').controller('SendController',
  function($scope, $rootScope, $location, Socket, controllerUtils) {
    $scope.title = 'Send';

    if (!$rootScope.wallet || !$rootScope.wallet.id) {
      $location.path('signin');
    }
    else {
      var socket = Socket($scope);
      socket.on('connect', controllerUtils.handleTransactionByAddress($scope));
   
    }

    $scope.sendTest = function() {
      var w    = $rootScope.wallet;
      w.createTx( '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt', '12345',function() {
        $rootScope.$digest();
      });
    };
  });
