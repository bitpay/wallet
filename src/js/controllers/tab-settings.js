'use strict';

angular.module('copayApp.controllers').controller('tabSettingsController', function($scope, $rootScope, $log, $window, lodash, configService, uxLanguage, platformInfo, pushNotificationsService, profileService, feeService) {

  var updateConfig = function() {

    var config = configService.getSync();
    var isCordova = platformInfo.isCordova;
    var isWP = platformInfo.isWP;
    var isIOS = platformInfo.isIOS;

    $scope.appName = $window.appConfig.nameCase;

    $scope.unitName = config.wallet.settings.unitName;
    $scope.currentLanguageName = uxLanguage.getCurrentLanguageName();
    $scope.selectedAlternative = {
      name: config.wallet.settings.alternativeName,
      isoCode: config.wallet.settings.alternativeIsoCode
    };
    $scope.feeOpts = feeService.feeOpts;
    $scope.currentFeeLevel = feeService.getCurrentFeeLevel();
    $scope.usePushNotifications = isCordova && !isWP;
    $scope.PNEnabledByUser = true;
    $scope.isIOSApp = isIOS && isCordova;
    if ($scope.isIOSApp) {
      cordova.plugins.diagnostic.isRemoteNotificationsEnabled(function(isEnabled) {
        $scope.PNEnabledByUser = isEnabled;
        $scope.$digest();
      });
    }
    $scope.spendUnconfirmed = config.wallet.spendUnconfirmed;
    $scope.glideraEnabled = config.glidera.enabled;
    $scope.coinbaseEnabled = config.coinbase.enabled;
    $scope.pushNotifications = config.pushNotifications.enabled;
    $scope.otherWallets = lodash.filter(profileService.getWallets(self.network), function(w) {
      return w.id != self.walletId;
    });
    $scope.wallets = profileService.getWallets();
  };

  $scope.openSettings = function() {
    cordova.plugins.diagnostic.switchToSettings(function() {
      $log.debug('switched to settings');
    }, function(err) {
      $log.debug(err);
    });
  };

  $scope.spendUnconfirmedChange = function() {
    var opts = {
      wallet: {
        spendUnconfirmed: $scope.spendUnconfirmed
      }
    };
    configService.set(opts, function(err) {
      if (err) $log.debug(err);
    });
  };

  $scope.pushNotificationsChange = function() {
    var opts = {
      pushNotifications: {
        enabled: $scope.pushNotifications
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

  $scope.glideraChange = function() {
    var opts = {
      glidera: {
        enabled: $scope.glideraEnabled
      }
    };
    configService.set(opts, function(err) {
      if (err) $log.debug(err);
    });
  };

  $scope.coinbaseChange = function() {
    var opts = {
      coinbase: {
        enabled: $scope.coinbaseEnabled
      }
    };
    configService.set(opts, function(err) {
      if (err) $log.debug(err);
    });
  };

  $scope.$on("$ionicView.enter", function(event, data){
    updateConfig();
  });

});
