'use strict';

angular.module('copayApp.controllers').controller('welcomeController', function($scope, $state, $timeout, $log, profileService) {

  $scope.goImport = function(code) {
    $state.go('onboarding.import', {
      fromOnboarding: true,
      code: code
    });
  };

  $scope.createProfile = function() {
    $log.debug('Creating profile');
    profileService.createProfile(function(err) {
      if (err) $log.warn(err);
    });
  };

});
