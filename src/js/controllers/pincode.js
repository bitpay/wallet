'use strict';

angular.module('copayApp.controllers').controller('pincodeController', function($rootScope, $state, $timeout, $scope, $log, $window, configService) {

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    $scope.currentPincode = $scope.newPincode = '';
    $scope.fromSettings = data.stateParams.fromSettings == 'true' ? true : false;
    $scope.locking = data.stateParams.locking == 'true' ? true : false;
    console.log('### From Settings:', $scope.fromSettings, 'Locking:', $scope.locking);
  });

  angular.element($window).on('keydown', function(e) {
    if (e.which === 8) {
      e.preventDefault();
      $scope.delete();
    }

    if (e && e.key.match(/^[0-9]$/))
      $scope.add(e.key);
    else if (e && e.keyCode == 27)
      $scope.close();
    else if (e && e.keyCode == 13)
      $scope.save();
  });

  $scope.add = function(value) {
    updatePassCode(value);
  };

  $scope.delete = function() {
    if ($scope.currentPincode.length > 0) {
      $scope.currentPincode = $scope.currentPincode.substring(0, $scope.currentPincode.length - 1);
      updatePassCode();
    }
  };

  function isComplete() {
    if ($scope.currentPincode.length < 4) return false;
    else return true;
  };

  function updatePassCode(value) {
    if (value && $scope.currentPincode.length < 4)
      $scope.currentPincode = $scope.currentPincode + value;
    $timeout(function() {
      $scope.$apply();
    });
  };

  $scope.save = function() {
    if (!isComplete()) return;
    var config = configService.getSync();
    var match = config.pincode.value == $scope.currentPincode ? true : false;

    if (!$scope.fromSettings && match) {
      $scope.currentPincode = '';
      $scope.close();
      return;
    }
    if (!$scope.locking) {
      if (!match) return;
      saveSettings($scope.locking, '');
    }
    checkCodes();
  };

  function checkCodes() {
    if (!$scope.newPincode) {
      $scope.newPincode = $scope.currentPincode;
      $scope.currentPincode = '';
    } else {
      if ($scope.newPincode == $scope.currentPincode)
        saveSettings($scope.locking, $scope.newPincode);
    }
    $timeout(function() {
      $scope.$apply();
    });
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
      $scope.close();
    });
  };

  $scope.close = function() {
    $rootScope.$emit('updatePincodeOption');
    if ($scope.fromSettings) $state.go('tabs.advanced');
    else $state.go('tabs.home');
  };
});
