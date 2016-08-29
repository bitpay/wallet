'use strict';

angular.module('copayApp.controllers').controller('notificationsController', function($scope, $state, profileService) {

  $scope.allowNotif = function() {
    profileService.pushNotificationsInit();
    $state.go('onboarding.backupRequest');
  }

});
