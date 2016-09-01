'use strict';

angular.module('copayApp.controllers').controller('backController', function($scope, $state, $stateParams, platformInfo) {

  var isCordova = platformInfo.isCordova;
  var isWP = platformInfo.isWP;
  var usePushNotifications = isCordova && !isWP;

  $scope.importGoBack = function() {
    if ($stateParams.fromOnboarding) $state.go('onboarding.welcome');
    else $state.go('tabs.add');
  };

  $scope.onboardingMailSkip = function() {
    if (!usePushNotifications) $state.go('onboarding.backupRequest');
    else $state.go('onboarding.notifications');
  }

});
