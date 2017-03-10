'use strict';

angular.module('copayApp.controllers').controller('lockappController', function($state, $scope, $log, configService, popupService, gettextCatalog, appConfigService) {

  $scope.$on("$ionicView.beforeEnter", function(event) {
    var config = configService.getSync();
    $scope.fingerprintAvailable = true;
    // $scope.fingerprintAvailable = fingerprintService.isAvailable();

    $scope.usePincode = {
      enabled: config.lockapp ? config.lockapp.pincode.enabled : false
    };
    $scope.useFingerprint = {
      enabled: config.lockapp ? config.lockapp.fingerprint.enabled : false
    };
  });

  $scope.usePincodeChange = function() {
    $state.go('tabs.lockapp.pincode', {
      fromSettings: true,
      locking: $scope.usePincode.enabled
    });
  };

  $scope.useFingerprintChange = function() {
    if ($scope.usePincode.enabled) {
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
          return;
        }
        saveConfig();
      });
    } else
      saveConfig();

    function saveConfig() {
      $scope.usePincode = {
        enabled: false
      };
      var opts = {
        lockapp: {
          pincode: {
            enabled: false,
            value: ''
          },
          fingerprint: {
            enabled: $scope.useFingerprint.enabled
          }
        }
      };

      configService.set(opts, function(err) {
        if (err) $log.debug(err);
      });
    };
  };
});
