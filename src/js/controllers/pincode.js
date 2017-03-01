'use strict';

angular.module('copayApp.controllers').controller('pincodeController', function($timeout, $scope, $log, $window, configService) {
  var config = configService.getSync();
  $scope.currentPincode = config.pincode ? config.pincode.value : null;
  $scope.pincode = $scope.pc1 = $scope.pc2 = '';

  console.log('#######', $scope.from, $scope.enabled);

  angular.element($window).on('keydown', function(e) {
    if (e.which === 8) { // you can add others here inside brackets.
      e.preventDefault();
      $scope.delete();
    }

    if (e && e.key.match(/^[0-9]$/))
      $scope.add(e.key);
    else if (e && e.keyCode == 27)
      $scope.close(false);
    else if (e && e.keyCode == 13)
      $scope.save();
  });

  $scope.add = function(value) {
    updatePassCode(value);
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
    if (value && $scope.pincode.length < 4)
      $scope.pincode = $scope.pincode + value;
    $timeout(function() {
      $scope.$apply();
    });
  };

  $scope.save = function() {
    if (!$scope.pc1) {
      console.log('No pc 1');
      $scope.pc1 = $scope.pincode;
      console.log('$scope.pc1', $scope.pc1);
      $scope.pincode = '';
      $timeout(function() {
        $scope.$apply();
      });
      return;
    } else {
      $scope.pc2 = $scope.pincode;
      console.log('$scope.pc2', $scope.pc2);
    }

    if ($scope.pc1 == $scope.pc2) {
      $scope.close($scope.pc1);
    } else {
      $scope.enabled ? pincodeService.lockApp() : pincodeService.unlockApp();
    }
  };

  $scope.close = function() {
    $scope.pincodeModal.hide();
  };
});
