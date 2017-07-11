'use strict';

angular.module('copayApp.controllers').controller('pinController', function($state, $interval, $stateParams, $ionicHistory, $timeout, $scope, $log, configService, appConfigService, applicationService) {
  var ATTEMPT_LIMIT = 3;
  var ATTEMPT_LOCK_OUT_TIME = 5 * 60;
  var currentPin;
  currentPin = $scope.confirmPin = '';

  $scope.match = $scope.error = $scope.disableButtons = false;
  $scope.currentAttempts = 0;
  $scope.appName = appConfigService.name;

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

  function getSavedMethod() {
    var config = configService.getSync();
    if (config.lock) return config.lock.method;
    return 'none';
  };

  function checkAttempts() {
    $scope.currentAttempts += 1;
    $log.debug('Attempts to unlock:', $scope.currentAttempts);
    if ($scope.currentAttempts === ATTEMPT_LIMIT) {
      $scope.currentAttempts = 0;
      var bannedUntil = Math.floor(Date.now() / 1000) + ATTEMPT_LOCK_OUT_TIME;
      saveFailedAttempt(bannedUntil);
    }
  };

  function lockTimeControl(bannedUntil) {
    setExpirationTime();

    var countDown = $interval(function() {
      setExpirationTime();
    }, 1000);

    function setExpirationTime() {
      var now = Math.floor(Date.now() / 1000);
      if (now > bannedUntil) {
        if (countDown) reset();
      } else {
        $scope.disableButtons = true;
        var totalSecs = bannedUntil - now;
        var m = Math.floor(totalSecs / 60);
        var s = totalSecs % 60;
        $scope.expires = ('0' + m).slice(-2) + ":" + ('0' + s).slice(-2);
      }
    };

    function reset() {
      $scope.expires = $scope.error = $scope.disableButtons = null;
      currentPin = $scope.confirmPin = '';
      $interval.cancel(countDown);
      $timeout(function() {
        $scope.$apply();
      });
      return;
    };
  };

  $scope.getFilledClass = function(limit) {
    return currentPin.length >= limit ? 'filled-' + $scope.appName : null;
  };

  $scope.delete = function() {
    if ($scope.disableButtons) return;
    if (currentPin.length > 0) {
      currentPin = currentPin.substring(0, currentPin.length - 1);
      $scope.error = false;
      $scope.updatePin();
    }
  };

  $scope.isComplete = function() {
    if (currentPin.length < 4) return false;
    else return true;
  };

  $scope.updatePin = function(value) {
    if ($scope.disableButtons) return;
    $scope.error = false;
    if (value && !$scope.isComplete()) {
      currentPin = currentPin + value;
      $timeout(function() {
        $scope.$apply();
      });
    }
    $scope.save();
  };

  function isMatch(pin) {
    var config = configService.getSync();
    return config.lock.value == pin;
  };

  $scope.save = function() {
    if (!$scope.isComplete()) return;
    var savedMethod = getSavedMethod();

    switch ($scope.action) {
      case 'setup':
        applyAndCheckPin();
        break;
      case 'disable':
        if (isMatch(currentPin)) {
          deletePin();
        } else {
          showError();
          checkAttempts();
        }
        break;
      case 'check':
        if (isMatch(currentPin)) {
          $scope.hideModal();
          return;
        }
        showError();
        checkAttempts();
        break;
    }
  };

  function showError() {
    $timeout(function() {
      $scope.confirmPin = currentPin = '';
      $scope.error = true;
    }, 200);

    $timeout(function() {
      $scope.$apply();
    });
  };

  function applyAndCheckPin() {
    if (!$scope.confirmPin) {
      $timeout(function() {
        $scope.confirmPin = currentPin;
        currentPin = '';
      }, 200);
    } else {
      if ($scope.confirmPin == currentPin)
        savePin($scope.confirmPin);
      else {
        $scope.confirmPin = currentPin = '';
        $scope.error = true;
      }
    }
    $timeout(function() {
      $scope.$apply();
    });
  };

  function deletePin() {
    var opts = {
      lock: {
        method: 'none',
        value: null,
        bannedUntil: null,
      }
    };

    configService.set(opts, function(err) {
      if (err) $log.debug(err);
      $scope.hideModal();
    });
  };

  function savePin(value) {
    var opts = {
      lock: {
        method: 'pin',
        value: value,
        bannedUntil: null,
      }
    };

    configService.set(opts, function(err) {
      if (err) $log.debug(err);
      $scope.hideModal();
    });
  };

  function saveFailedAttempt(bannedUntil) {
    var opts = {
      lock: {
        bannedUntil: bannedUntil,
      }
    };

    configService.set(opts, function(err) {
      if (err) $log.debug(err);
      lockTimeControl(bannedUntil);
    });
  };

});
