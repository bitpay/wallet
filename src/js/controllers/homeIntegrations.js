'use strict';

angular.module('copayApp.controllers').controller('homeIntegrationsController', function($rootScope, $scope, homeIntegrationsService, $ionicScrollDelegate, $timeout) {

  $scope.hide = false;

  $scope.$on("$ionicParentView.beforeEnter", function(event, data) {
    // Available services may have changed, refresh each time the parent (home) view enters.
    init();
	});

  $rootScope.$on('Local/HomeIntegrationsChanged', function() {
    // Catch late changes when the view is already presented (e.g., startup).
    init();
  });

  function init() {
    $scope.services = homeIntegrationsService.get();
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
