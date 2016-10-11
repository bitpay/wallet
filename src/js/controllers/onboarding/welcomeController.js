'use strict';

angular.module('copayApp.controllers').controller('welcomeController', function($scope, $state, $timeout, $ionicConfig, $log, profileService) {

  $ionicConfig.views.swipeBackEnabled(false);

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
