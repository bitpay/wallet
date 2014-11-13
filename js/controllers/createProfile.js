'use strict';

angular.module('copayApp.controllers').controller('CreateProfileController', function($scope, $rootScope, $location, notification, controllerUtils, pluginManager, identityService) {
  controllerUtils.redirIfLogged();
  $scope.loading = false;
  $scope.createProfile = function(form) {
    if (form && form.$invalid) {
      $scope.error('Error', 'Please enter the required fields');
      return;
    }
    $rootScope.starting = true;
    identityService.create($scope, form);
  }

});
