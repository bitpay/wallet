'use strict';

angular.module('copayApp.controllers').controller('notificationsController', function($scope, $state, $timeout, $stateParams, profileService, configService) {

  $scope.$on("$ionicView.enter", function(event, data) {
    $scope.walletId = data.stateParams.walletId;
  });

  $scope.allowNotif = function() {
    $timeout(function() {
      profileService.pushNotificationsInit();
    });
    $state.go('onboarding.backupRequest', {
      walletId: $scope.walletId
    });
  }

  $scope.disableNotif = function() {
    var opts = {
      pushNotifications: {
        enabled: false
      }
    };
    configService.set(opts, function(err) {
      if (err) $log.warn(err);
      $state.go('onboarding.backupRequest', {
        walletId: $scope.walletId
      });
    });
  };

});
