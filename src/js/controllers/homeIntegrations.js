'use strict';

angular.module('copayApp.controllers').controller('homeIntegrationsController', function($scope, homeIntegrationsService, $ionicScrollDelegate, $timeout) {

  $scope.hide = false;
  $scope.services = homeIntegrationsService.get();

  $scope.toggle = function() {
    $scope.hide = !$scope.hide;
    $timeout(function() {
      $ionicScrollDelegate.resize();
      $scope.$apply();
    }, 10);
  };

});
