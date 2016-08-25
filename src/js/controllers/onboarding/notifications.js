'use strict';

angular.module('copayApp.controllers').controller('notificationsController', function($scope, $state, platformInfo) {

  if (!platformInfo.isCordova) $state.go('onboarding.backupRequest');

  $scope.allowNotif = function() {
    // T O D O
    $state.go('onboarding.backupRequest');
  }

});
