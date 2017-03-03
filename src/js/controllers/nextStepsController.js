'use strict';

angular.module('copayApp.controllers').controller('nextStepsController', function($rootScope, $scope, nextStepsService, $ionicScrollDelegate, $timeout) {

  $scope.hide = false;
  
  $scope.$on("$ionicParentView.beforeEnter", function(event, data) {
    // Available services may have changed, refresh each time the parent (home) view enters.
    init();
  });

  $rootScope.$on('Local/NextStepsChanged', function() {
    // Catch late changes when the view is already presented (e.g., startup).
    init();
  });

  function init() {
    $scope.services = nextStepsService.get();
  };

  $scope.toggle = function() {
    $scope.hide = !$scope.hide;
    $timeout(function() {
      $ionicScrollDelegate.resize();
      $scope.$apply();
    }, 10);
  };

  init();
});
