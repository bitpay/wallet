'use strict';

angular.module('copayApp.controllers').controller('preferencesGlobalController',
  function($scope, $rootScope, $log, configService, uxLanguage, platformInfo, pushNotificationsService, profileService, feeService) {

    var isCordova = platformInfo.isCordova;
    this.init = function() {
      var config = configService.getSync();
      this.unitName = config.wallet.settings.unitName;
      this.currentLanguageName = uxLanguage.getCurrentLanguageName();
      this.selectedAlternative = {
        name: config.wallet.settings.alternativeName,
        isoCode: config.wallet.settings.alternativeIsoCode
      };
      this.feeOpts = feeService.feeOpts;
      this.currentFeeLevel = feeService.getCurrentFeeLevel();
      this.usePushNotifications = isCordova && !platformInfo.isWP;
      $scope.PNEnabledByUser = true;
      $scope.isIOSApp = platformInfo.isIOS && isCordova;
      if ($scope.isIOSApp) {
        cordova.plugins.diagnostic.isRemoteNotificationsEnabled(function(isEnabled) {
          $scope.PNEnabledByUser = isEnabled;
        });
      }
      $scope.spendUnconfirmed = config.wallet.spendUnconfirmed;
      $scope.glideraEnabled = config.glidera.enabled;
      $scope.coinbaseEnabled = config.coinbase.enabled;
      $scope.pushNotifications = config.pushNotifications.enabled;
    };

    this.openSettings = function() {
      cordova.plugins.diagnostic.switchToSettings(function() {
        $log.debug('switched to settings');
      }, function(err) {
        $log.debug(err);
      });
    }

    $scope.spendUnconfirmedChange = function() {
      var opts = {
        wallet: {
          spendUnconfirmed: $scope.spendUnconfirmed
        }
      };
      configService.set(opts, function(err) {
        $rootScope.$emit('Local/SpendUnconfirmedUpdated', $scope.spendUnconfirmed);
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
        $rootScope.$emit('Local/GlideraUpdated');
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
        $rootScope.$emit('Local/CoinbaseUpdated');
        if (err) $log.debug(err);
      });
    };
  });
