'use strict';

angular.module('copayApp.controllers').controller('tabsController', function($log, $scope, $stateParams, $ionicModal, $timeout, incomingData) {

  $scope.onScan = function(data) {
    if (!incomingData.redir(data)) {
      $ionicPopup.alert({
        title: 'Invalid data',
      });
    }
  }

  $scope.setScanFn = function(scanFn) {
    $scope.scan = function() {
      $log.debug('Scanning...');
      scanFn();
    };
  };

  $scope.importInit = function() {
    $scope.fromOnboarding = $stateParams.fromOnboarding;
    $timeout(function() {
      $scope.$apply();
    }, 1);
  }

});
