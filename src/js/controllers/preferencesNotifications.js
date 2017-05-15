'use strict';

angular.module('copayApp.controllers').controller('preferencesNotificationsController', function($scope, $log, $timeout, appConfigService, lodash, configService, platformInfo, pushNotificationsService, emailService) {
  var updateConfig = function() {
    var config = configService.getSync();
    $scope.appName = appConfigService.nameCase;
    $scope.PNEnabledByUser = true;
    $scope.usePushNotifications = platformInfo.isCordova && !platformInfo.isWP;
    $scope.isIOSApp = platformInfo.isIOS && platformInfo.isCordova;

    $scope.pushNotifications = {
      value: config.pushNotificationsEnabled
    };

    $scope.latestEmail = {
      value: emailService.getEmailIfEnabled()
    };

    $scope.newEmail = lodash.clone($scope.latestEmail);
    var isEmailEnabled = config.emailNotifications ? config.emailNotifications.enabled : false;

    $scope.emailNotifications = {
      value: isEmailEnabled && $scope.newEmail.value ? true : false
    };

    $timeout(function() {
      $scope.$apply();
    });
  };

  $scope.pushNotificationsChange = function() {
    if (!$scope.pushNotifications) return;
    var opts = {
      pushNotificationsEnabled: $scope.pushNotifications.value
    };
    configService.set(opts, function(err) {
      if (err) $log.debug(err);
      if (opts.pushNotificationsEnabled)
        pushNotificationsService.init();
      else
        pushNotificationsService.disable();
    });
  };

  $scope.emailNotificationsChange = function() {
    var opts = {
      enabled: $scope.emailNotifications.value,
      email: $scope.newEmail.value
    };

    $scope.latestEmail = {
      value: emailService.getEmailIfEnabled()
    };

    emailService.updateEmail(opts);
  };

  $scope.save = function() {
    emailService.updateEmail({
      enabled: $scope.emailNotifications.value,
      email: $scope.newEmail.value
    });

    $scope.latestEmail = {
      value: $scope.newEmail.value
    };

    $timeout(function() {
      $scope.$apply();
    });
  };

  $scope.$on("$ionicView.enter", function(event, data) {
    updateConfig();
  });
});
