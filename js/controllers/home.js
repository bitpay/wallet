'use strict';

angular.module('copayApp.controllers').controller('HomeController', function($scope, $rootScope, $location, notification, controllerUtils, pluginManager, identityService) {
  controllerUtils.redirIfLogged();
  $scope.retreiving = true;

  identityService.check($scope);

  $scope.openProfile = function(form) {
    if (form && form.$invalid) {
      notification.error('Error', 'Please enter the required fields');
      return;
    }
    $scope.loading = true;
    identityService.open($scope, form);
  }
});
