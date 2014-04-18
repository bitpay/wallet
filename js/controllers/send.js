'use strict';

angular.module('copay.send').controller('SendController',
  function($scope, $rootScope, $location) {
    $scope.title = 'Send';

    $scope.sendTest = function() {
      var w    = $rootScope.wallet;
      w.createTx( 'mimoZNLcP2rrMRgdeX5PSnR7AjCqQveZZ4', '12345',function() {
        $rootScope.$digest();
      });
    };
  });
