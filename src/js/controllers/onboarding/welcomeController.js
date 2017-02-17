'use strict';

angular.module('copayApp.controllers').controller('welcomeController', function($scope, $state, $timeout, $ionicConfig, $log, profileService, startupService, storageService) {

  $ionicConfig.views.swipeBackEnabled(false);

  $scope.$parent.$on("$ionicView.afterEnter", function() {
    startupService.ready();
  });

  $scope.createProfile = function() {
    $log.debug('Creating profile');
    profileService.createProfile(function(err) {
      if (err) $log.warn(err);
    });
  };

});
