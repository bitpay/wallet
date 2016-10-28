'use strict';

angular.module('copayApp.controllers').controller('preferencesNotificationsController',
  function($scope, $rootScope, $log, $window, lodash, configService, uxLanguage, platformInfo, pushNotificationsService, profileService, feeService) {

    var updateConfig = function() {

      var config = configService.getSync();
      var isCordova = platformInfo.isCordova;
      var isIOS = platformInfo.isIOS;

      $scope.appName = $window.appConfig.nameCase;
      $scope.PNEnabledByUser = true;
      $scope.isIOSApp = isIOS && isCordova;
      if ($scope.isIOSApp) {
        try {
          PushNotification.hasPermission(function(data) {
            $scope.PNEnabledByUser = data.isEnabled;
          });
        } catch(e) {
          $log.error(e);
        };
      }

      $scope.pushNotifications = {
        value: config.pushNotifications.enabled
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

    $scope.$on("$ionicView.enter", function(event, data) {
      updateConfig();
    });
  });
