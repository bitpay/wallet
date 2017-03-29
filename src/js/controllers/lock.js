'use strict';

angular.module('copayApp.controllers').controller('lockController', function($state, $scope, $timeout, $log, configService, popupService, gettextCatalog, appConfigService, fingerprintService) {

  $scope.$on("$ionicView.beforeEnter", function(event) {
    var config = configService.getSync();
    $scope.fingerprintAvailable = fingerprintService.isAvailable();

    $scope.usePin = {
      enabled: config.lock && config.lock.method == 'pin' ? true : false
    };
    $scope.useFingerprint = {
      enabled: config.lock && config.lock.method == 'fingerprint' ? true : false
    };
  });

  $scope.usePinChange = function() {
    $state.go('tabs.lock.pin', {
      fromSettings: true,
      locking: $scope.usePin.enabled
    });
  };

  $scope.useFingerprintChange = function() {
    if ($scope.usePin.enabled) {
      var message = gettextCatalog.getString('{{appName}} is protected by Pin Code. Are you sure you want to disable it?', {
        appName: appConfigService.nameCase
      });
      var okText = gettextCatalog.getString('Yes');
      var cancelText = gettextCatalog.getString('Cancel');
      popupService.showConfirm(null, message, okText, cancelText, function(ok) {
        if (!ok) {
          $scope.useFingerprint = {
            enabled: false
          };
          $timeout(function() {
            $scope.$apply();
          });
          return;
        }
        saveConfig();
      });
    } else
      saveConfig();

    function saveConfig() {
      $scope.usePin = {
        enabled: false
      };
      $timeout(function() {
        $scope.$apply();
      });
      var opts = {
        lock: {
          method: $scope.useFingerprint.enabled ? 'fingerprint' : '',
          value: '',
        }
      };

      configService.set(opts, function(err) {
        if (err) $log.debug(err);
      });
    };
  };
});
