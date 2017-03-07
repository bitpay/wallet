'use strict';

angular.module('copayApp.controllers').controller('pincodeController', function($state, $stateParams, $timeout, $scope, $log, $window, configService) {

  $scope.$on("$ionicView.beforeEnter", function(event) {
    $scope.currentPincode = $scope.newPincode = '';
    $scope.fromSettings = $stateParams.fromSettings == 'true' ? true : false;
    $scope.locking = $stateParams.locking == 'true' ? true : false;
  });

  $scope.delete = function() {
    if ($scope.currentPincode.length > 0) {
      $scope.currentPincode = $scope.currentPincode.substring(0, $scope.currentPincode.length - 1);
      $scope.updatePinCode();
    }
  };

  function isComplete() {
    if ($scope.currentPincode.length < 4) return false;
    else return true;
  };

  $scope.updatePinCode = function(value) {
    if (value && !isComplete()) {
      $scope.currentPincode = $scope.currentPincode + value;
    }
    $timeout(function() {
      $scope.$apply();
    });
    if (!$scope.locking && isComplete()) {
      $scope.save();
    }
  };

  $scope.save = function() {
    if (!isComplete()) return;
    var config = configService.getSync();
    var match = config.pincode.value == $scope.currentPincode ? true : false;

    if (!$scope.locking) {
      if (match) {
        $scope.fromSettings ? saveSettings($scope.locking, '') : $scope.close();
        return;
      }
    } else {
      checkCodes();
    }
  };

  function checkCodes() {
    if (!$scope.newPincode) {
      $scope.newPincode = $scope.currentPincode;
      $scope.currentPincode = '';
      $timeout(function() {
        $scope.$apply();
      });
    } else {
      if ($scope.newPincode == $scope.currentPincode)
        saveSettings($scope.locking, $scope.newPincode);
    }
  };

  function saveSettings(enabled, value) {
    var opts = {
      pincode: {
        enabled: enabled,
        value: value
      }
    };

    configService.set(opts, function(err) {
      if (err) $log.debug(err);
      $timeout(function() {
        $scope.close();
      });
    });
  };

  $scope.close = function() {
    if ($scope.fromSettings) $state.go('tabs.advanced');
    else $state.go('tabs.home');
  };
});
