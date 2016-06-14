'use strict';

angular.module('copayApp.controllers').controller('preferencesEmailController', function($rootScope, $scope, go, profileService, walletService) {
  $scope.save = function(form) {
    $scope.error = null;
    $scope.saving = true;
    var fc = profileService.focusedClient;
    var email = $scope.email || '';

    walletService.updateRemotePreferences(fc, {
      email: email,
    }, function(err) {
      $scope.saving = false;
      if (!err)
        $rootScope.$emit('Local/EmailUpdated', email);
      go.path('preferences');
    });
  };
});
