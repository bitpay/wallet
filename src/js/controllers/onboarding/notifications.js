'use strict';

angular.module('copayApp.controllers').controller('notificationsController', function($scope, $state, $stateParams, profileService) {
console.log('[notifications.js:3]',$stateParams); //TODO

  $scope.walletId = $stateParams.walletId;
  $scope.allowNotif = function() {
    profileService.pushNotificationsInit();
    $state.go('onboarding.backupRequest');
  }

});
