'use strict';

angular.module('copayApp.controllers').controller('preferencesNotificationsController', function($scope, $log, $window, configService, platformInfo, pushNotificationsService, profileService, emailService) {
  var updateConfig = function() {
    $scope.appName = $window.appConfig.nameCase;
    $scope.PNEnabledByUser = true;
    $scope.usePushNotifications = platformInfo.isCordova && !platformInfo.isWP;
    $scope.isIOSApp = platformInfo.isIOS && platformInfo.isCordova;

    if ($scope.isIOSApp) {
      try {
        PushNotification.hasPermission(function(data) {
          $scope.PNEnabledByUser = data.isEnabled;
        });
      } catch (e) {
        $log.error(e);
      };
    }

    var config = configService.getSync();

    $scope.pushNotifications = {
      value: config.pushNotifications.enabled
    };

    $scope.emailNotifications = {
      value: config.emailNotifications ? config.emailNotifications.enabled : false
    };
  };

  $scope.pushNotificationsChange = function() {
    if (!$scope.pushNotifications) return;
    var opts = {
      pushNotifications: {
        enabled: $scope.pushNotifications.value
      }
    };
    configService.set(opts, function(err) {
      if (opts.pushNotifications.enabled)
        profileService.pushNotificationsInit();
      else
        pushNotificationsService.disableNotifications(profileService.getWallets());
      if (err) $log.debug(err);
    });
  };

  $scope.emailNotificationsChange = function() {
    var opts = {
      emailNotifications: {
        enabled: $scope.emailNotifications.value
      }
    };
    emailService.enableEmailNotifications($scope.emailNotifications.value);
    configService.set(opts, function(err) {
      if (err) $log.debug(err);
    });
  };

  $scope.$on("$ionicView.enter", function(event, data) {
    updateConfig();
  });
});
