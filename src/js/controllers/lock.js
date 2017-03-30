'use strict';

angular.module('copayApp.controllers').controller('lockController', function($state, $scope, $timeout, $log, configService, popupService, gettextCatalog, appConfigService, fingerprintService, profileService, lodash) {

  $scope.$on("$ionicView.beforeEnter", function(event) {
    var config = configService.getSync();
    $scope.fingerprintAvailable = fingerprintService.isAvailable();

    $scope.usePin = {
      enabled: config.lock && config.lock.method == 'pin' ? true : false
    };
    $scope.useFingerprint = {
      enabled: config.lock && config.lock.method == 'fingerprint' ? true : false
    };

    processWallets();
  });

  function processWallets() {
    var wallets = profileService.getWallets();
    var singleLivenetWallet = wallets.length == 1 && wallets[0].network == 'livenet' && wallets[0].needsBackup;
    var atLeastOneLivenetWallet = lodash.any(wallets, function(w) {
      return w.network == 'livenet' && w.needsBackup;
    });

    if (singleLivenetWallet) {
      $scope.errorMsg = gettextCatalog.getString('Backup your wallet before using this function');
    } else if (atLeastOneLivenetWallet) {
      $scope.errorMsg = gettextCatalog.getString('Backup all livenet wallets before using this function');
    } else $scope.errorMsg = null;

    $timeout(function() {
      $scope.$apply();
    });
  };

  $scope.usePinChange = function() {
    $scope.usePin.enabled = !$scope.usePin.enabled;
    $state.transitionTo('tabs.lock.pin', {
      fromSettings: true,
      locking: !$scope.usePin.enabled
    }).then(function() {
      $timeout(function() {
        $scope.usePin.enabled = !$scope.usePin.enabled;
      }, 1000);
    });
  };

  $scope.useFingerprintChange = function() {
    if ($scope.usePin.enabled) {
      var message = gettextCatalog.getString('{{appName}} is protected by Pin. Are you sure you want to disable it?', {
        appName: appConfigService.nameCase
      });
      var okText = gettextCatalog.getString('Continue');
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
