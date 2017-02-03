'use strict';

angular.module('copayApp.controllers').controller('notificationsController', function($scope, $state, $timeout, $stateParams, $ionicConfig, profileService, configService, $interval, pushNotificationsService) {

  $scope.$on("$ionicView.enter", function() {
    $ionicConfig.views.swipeBackEnabled(false);
  });

  $scope.$on("$ionicView.beforeLeave", function() {
    $ionicConfig.views.swipeBackEnabled(true);
  });

  $scope.walletId = $stateParams.walletId;

  $scope.allowNotif = function() {
    $scope.notificationDialogOpen = true;
    $timeout(function() {
      pushNotificationsService.init();
    });
    $scope.notificationPromise = $interval(function() {
      PushNotification.hasPermission(function(data) {
        if (data.isEnabled) {
          $interval.cancel($scope.notificationPromise);
          $state.go('onboarding.backupRequest', {
            walletId: $scope.walletId
          });
        }
      });
    }, 100);
  }

  $scope.continue = function() {
    $interval.cancel($scope.notificationPromise);
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
