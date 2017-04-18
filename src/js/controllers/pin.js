'use strict';

angular.module('copayApp.controllers').controller('pinController', function($state, $interval, $stateParams, $ionicHistory, $timeout, $scope, $log, configService, appConfigService) {
  var ATTEMPT_LIMIT = 3;
  var ATTEMPT_LOCK_OUT_TIME = 5 * 60;

  $scope.$on("$ionicView.beforeEnter", function(event) {
    $scope.currentPin = $scope.confirmPin = '';
    $scope.fromSettings = $stateParams.fromSettings == 'true' ? true : false;
    $scope.locking = $stateParams.locking == 'true' ? true : false;
    $scope.match = $scope.error = $scope.disableButtons = false;
    $scope.currentAttempts = 0;
    $scope.appName = appConfigService.name;
  });

  $scope.$on("$ionicView.enter", function(event) {
    configService.whenAvailable(function(config) {
      if (!config.lock) return;
      $scope.bannedUntil = config.lock.bannedUntil || null;
      if ($scope.bannedUntil) {
        var now = Math.floor(Date.now() / 1000);
        if (now < $scope.bannedUntil) {
          $scope.error = $scope.disableButtons = true;
          lockTimeControl($scope.bannedUntil);
        }
      }
    });
  });

  function checkAttempts() {
    $scope.currentAttempts += 1;
    $log.debug('Attempts to unlock:', $scope.currentAttempts);
    if ($scope.currentAttempts === ATTEMPT_LIMIT) {
      $scope.currentAttempts = 0;
      var limitTime = Math.floor(Date.now() / 1000) + ATTEMPT_LOCK_OUT_TIME;
      var config = configService.getSync();
      var opts = {
        lock: {
          method: 'pin',
          value: config.lock.value,
          bannedUntil: limitTime,
          attempts: config.lock.attempts + 1,
        }
      };

      configService.set(opts, function(err) {
        if (err) $log.debug(err);
        lockTimeControl(limitTime);
      });
    }
  };

  function lockTimeControl(limitTime) {
    $scope.limitTimeExpired = false;
    setExpirationTime();

    var countDown = $interval(function() {
      setExpirationTime();
    }, 1000);

    function setExpirationTime() {
      var now = Math.floor(Date.now() / 1000);
      if (now > limitTime) {
        $scope.limitTimeExpired = true;
        if (countDown) reset();
      } else {
        $scope.disableButtons = true;
        var totalSecs = limitTime - now;
        var m = Math.floor(totalSecs / 60);
        var s = totalSecs % 60;
        $scope.expires = ('0' + m).slice(-2) + ":" + ('0' + s).slice(-2);
      }
    };

    function reset() {
      $scope.expires = $scope.error = $scope.disableButtons = null;
      $scope.currentPin = $scope.confirmPin = '';
      $interval.cancel(countDown);
      $timeout(function() {
        $scope.$apply();
      });
      return;
    };
  };

  $scope.getFilledClass = function(limit) {
    return $scope.currentPin.length >= limit ? 'filled-' + $scope.appName : null;
  };

  $scope.delete = function() {
    if ($scope.disableButtons) return;
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
    if ($scope.disableButtons) return;
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
    $scope.match = config.lock && config.lock.method == 'pin' && config.lock.value == $scope.currentPin ? true : false;
    if (!$scope.locking) {
      if ($scope.match) {
        if ($scope.fromSettings) saveSettings();
        else {
          saveSettings('pin', $scope.currentPin);
          $scope.error = false;
        }
      } else {
        $timeout(function() {
          $scope.confirmPin = $scope.currentPin = '';
          $scope.error = true;
        }, 200);
        checkAttempts();
      }
    } else {
      processCodes();
    }
  };

  function processCodes() {
    if (!$scope.confirmPin) {
      $timeout(function() {
        $scope.confirmPin = $scope.currentPin;
        $scope.currentPin = '';
      }, 200);
    } else {
      if ($scope.confirmPin == $scope.currentPin)
        saveSettings('pin', $scope.confirmPin);
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
    var config = configService.getSync();
    var attempts = config.lock && config.lock.attempts ? config.lock.attempts : 0;
    var opts = {
      lock: {
        method: method || '',
        value: value || '',
        bannedUntil: null,
        attempts: attempts + 1,
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
