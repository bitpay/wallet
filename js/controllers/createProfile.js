'use strict';

angular.module('copayApp.controllers').controller('CreateProfileController', function($scope, $rootScope, $location, notification, pluginManager, identityService) {

  identityService.goWalletHome();

  $scope.loading = false;
  $scope.createProfile = function(form) {
    if (form && form.$invalid) {
      $scope.error('Error', 'Please enter the required fields');
      return;
    }
    identityService.create(
      form.email.$modelValue, form.password.$modelValue, function(err) {
      if (err) $scope.error('Error', err.toString());

      $rootScope.$digest();
    });
  }

});
