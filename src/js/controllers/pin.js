'use strict';

angular.module('copayApp.controllers').controller('pinController', function($state, $stateParams, $ionicHistory, $timeout, $scope, $log, configService, appConfigService) {
  var PIN = 'pin';

  $scope.$on("$ionicView.beforeEnter", function(event) {
    $scope.currentPin = $scope.confirmPin = '';
    $scope.fromSettings = $stateParams.fromSettings == 'true' ? true : false;
    $scope.locking = $stateParams.locking == 'true' ? true : false;
    $scope.match = false;
    $scope.error = false;
    $scope.appName = appConfigService.name;
  });

  $scope.getFilledClass = function(limit) {
    return $scope.currentPin.length >= limit ? 'filled-' + $scope.appName : null;
  };

  $scope.delete = function() {
    if ($scope.currentPin.length > 0) {
      $scope.currentPin = $scope.currentPin.substring(0, $scope.currentPin.length - 1);
      $scope.error = false;
      $scope.updatePin();
    }
  };

  $scope.isComplete = function() {
    if ($scope.currentPin.length < 4) return false;
    else return true;
  };

  $scope.updatePin = function(value) {
    $scope.error = false;
    if (value && !$scope.isComplete()) {
      $scope.currentPin = $scope.currentPin + value;
      $timeout(function() {
        $scope.$apply();
      });
    }
    $scope.save();
  };

  $scope.save = function() {
    if (!$scope.isComplete()) return;
    var config = configService.getSync();
    $scope.match = config.lock && config.lock.method == PIN && config.lock.value == $scope.currentPin ? true : false;
    if (!$scope.locking) {
      if ($scope.match) {
        $scope.fromSettings ? saveSettings() : $scope.close(150);
        $scope.error = false;
      } else {
        $scope.confirmPin = $scope.currentPin = '';
        $scope.error = true;
      }
    } else {
      processCodes();
    }
  };

  function processCodes() {
    if (!$scope.confirmPin) {
      $scope.confirmPin = $scope.currentPin;
      $timeout(function() {
        $scope.currentPin = '';
      }, 200);
    } else {
      if ($scope.confirmPin == $scope.currentPin)
        saveSettings(PIN, $scope.confirmPin);
      else {
        $scope.confirmPin = $scope.currentPin = '';
        $scope.error = true;
      }
    }
    $timeout(function() {
      $scope.$apply();
    });
  };

  function saveSettings(method, value) {
    var opts = {
      lock: {
        method: method || '',
        value: value || '',
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
