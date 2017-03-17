'use strict';

angular.module('copayApp.controllers').controller('pincodeController', function($state, $stateParams, $ionicHistory, $timeout, $scope, $log, configService, appConfigService) {

  $scope.$on("$ionicView.beforeEnter", function(event) {
    $scope.currentPincode = $scope.newPincode = '';
    $scope.fromSettings = $stateParams.fromSettings == 'true' ? true : false;
    $scope.locking = $stateParams.locking == 'true' ? true : false;
    $scope.match = false;
    $scope.appName = appConfigService.name;
  });

  $scope.getFilledClass = function(limit) {
    return $scope.currentPincode.length >= limit ? 'filled-' + $scope.appName : null;
  };

  $scope.delete = function() {
    if ($scope.currentPincode.length > 0) {
      $scope.currentPincode = $scope.currentPincode.substring(0, $scope.currentPincode.length - 1);
      $scope.updatePinCode();
    }
  };

  $scope.isComplete = function() {
    if ($scope.currentPincode.length < 4) return false;
    else return true;
  };

  $scope.updatePinCode = function(value) {
    if (value && !$scope.isComplete()) {
      $scope.currentPincode = $scope.currentPincode + value;
    }
    $timeout(function() {
      $scope.$apply();
    });
    if (!$scope.locking && $scope.isComplete()) {
      $scope.save();
    }
  };

  $scope.save = function() {
    if (!$scope.isComplete()) return;
    var config = configService.getSync();
    $scope.match = config.lockapp.pincode.value == $scope.currentPincode ? true : false;
    $timeout(function() {
      $scope.$apply();
    });
    if (!$scope.locking) {
      if ($scope.match) {
        $scope.fromSettings ? saveSettings($scope.locking, '') : $scope.close(150);
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
      lockapp: {
        pincode: {
          enabled: enabled,
          value: value
        },
        fingerprint: {
          enabled: false
        }
      }
    };

    configService.set(opts, function(err) {
      if (err) $log.debug(err);
      $scope.close();
    });
  };

  $scope.close = function(delay) {
    $timeout(function() {
      $ionicHistory.viewHistory().backView ? $ionicHistory.goBack() : $state.go('tabs.home');
    }, delay || 1);
  };
});
