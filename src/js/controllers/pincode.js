'use strict';

angular.module('copayApp.controllers').controller('pincodeController', function($timeout, $scope, $log, $window) {

  angular.element($window).on('keydown', function(e) {
    if (e.which === 8) { // you can add others here inside brackets.
      e.preventDefault();
      $scope.delete();
    }

    if (e.key && e.key.match(/^[0-9]$/))
      $scope.add(e.key);
    else if (e.key && e.key == 'Enter')
      console.log('DONE');
  });

  $scope.$on('$ionicView.beforeEnter', function(event, data) {
    $scope.passcode = "";
  });

  $scope.add = function(value) {
    if (isComplete()) $log.debug("The four digit code was entered");
    else updatePassCode(value);
  };

  $scope.delete = function() {
    if ($scope.passcode.length > 0) {
      $scope.passcode = $scope.passcode.substring(0, $scope.passcode.length - 1);
      updatePassCode();
    }
  };

  function isComplete() {
    if ($scope.passcode.length < 4) return false;
    else return true;
  };

  function updatePassCode(value) {
    if (value) $scope.passcode = $scope.passcode + value;
    $timeout(function() {
      $scope.$apply();
    });
  };
});
