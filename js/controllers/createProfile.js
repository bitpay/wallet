'use strict';

angular.module('copayApp.controllers').controller('CreateProfileController', function($scope, $rootScope, $location, notification, pluginManager, identityService) {
  identityService.goWalletHome();

  $scope.createProfile = function(form) {
    if (form && form.$invalid) {
      $scope.error('Error', 'Please enter the required fields');
      return;
    }
    $rootScope.starting = true;
    identityService.create(
      form.email.$modelValue, form.password.$modelValue, function(err) {
        $rootScope.starting = false;
        if (err) {
          var msg = err.toString();
          if (msg.indexOf('EEXIST')>=0 || msg.indexOf('BADC')>=0 ) {
            msg = 'This profile already exists'
          } 
          $scope.error =  msg;
        } 
    });
  }
});
