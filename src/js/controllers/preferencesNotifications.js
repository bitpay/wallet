'use strict';

angular.module('copayApp.controllers').controller('preferencesNotificationsController',
  function($scope, $rootScope, $log, $window, lodash, configService, uxLanguage, platformInfo, pushNotificationsService, profileService, feeService) {

    var updateConfig = function() {

      var config = configService.getSync();
      var isCordova = platformInfo.isCordova;
      var isIOS = platformInfo.isIOS;

      $scope.PNEnabledByUser = true;
      $scope.isIOSApp = isIOS && isCordova;
      if ($scope.isIOSApp) {
        cordova.plugins.diagnostic.isRemoteNotificationsEnabled(function(isEnabled) {
          $scope.PNEnabledByUser = isEnabled;
          $scope.$digest();
        });
      }

      $scope.pushNotifications = {
        value: config.pushNotifications.enabled
      };
    };

    $scope.openSettings = function() {
      cordova.plugins.diagnostic.switchToSettings(function() {
        $log.debug('switched to settings');
      }, function(err) {
        $log.debug(err);
      });
    };

    $scope.pushNotificationsChange = function() {
      var opts = {
        pushNotifications: {
          enabled: $scope.pushNotifications.value
        }
      };
      configService.set(opts, function(err) {
        if (opts.pushNotifications.enabled)
          pushNotificationsService.enableNotifications(profileService.walletClients);
        else
          pushNotificationsService.disableNotifications(profileService.walletClients);
        if (err) $log.debug(err);
      });
    };

    $scope.$on("$ionicView.enter", function(event, data) {
      updateConfig();
    });
  });
