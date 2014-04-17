'use strict';

angular.module('copay.send').controller('SendController',
  function($scope, $rootScope, $location) {
    $scope.title = 'Send';

    if (!$rootScope.wallet.id) {
      $location.path('signin');
    }


    $scope.sendTest = function() {
      var w    = $rootScope.wallet;
      w.createTx( '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt', '12345',function() {
        $rootScope.$digest();
      });
    };
  });
