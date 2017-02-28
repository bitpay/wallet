'use strict';

angular.module('copayApp.controllers').controller('pincodeController', function($timeout, $scope, $log, $window, configService) {
  $scope.pincode = '';

  angular.element($window).on('keydown', function(e) {
    if (e.which === 8) { // you can add others here inside brackets.
      e.preventDefault();
      $scope.delete();
    }

    if (e.key && e.key.match(/^[0-9]$/))
      $scope.add(e.key);
    else if (e.key && e.key == 'Enter')
      checkPasscode();
  });

  $scope.add = function(value) {
    if (isComplete()) checkPasscode();
    else updatePassCode(value);
  };

  $scope.delete = function() {
    if ($scope.pincode.length > 0) {
      $scope.pincode = $scope.pincode.substring(0, $scope.pincode.length - 1);
      updatePassCode();
    }
  };

  function isComplete() {
    if ($scope.pincode.length < 4) return false;
    else return true;
  };

  function updatePassCode(value) {
    if (value) $scope.pincode = $scope.pincode + value;
    $timeout(function() {
      checkPasscode();
      $scope.$apply();
    });
  };

  function checkPasscode() {
    console.log('Checking');
    configService.whenAvailable(function(config) {
      var value = '1234';
      if (value != $scope.pincode) return;
      console.log('MATCH');
    });
  };

  $scope.cancel = function() {
    $scope.savePincodeChanges(false);
    $scope.pincodeModal.hide();
  };
});
