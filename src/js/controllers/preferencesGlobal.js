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

    var unwatchSpendUnconfirmed = $scope.$watch('spendUnconfirmed', function(newVal, oldVal) {
      if (newVal == oldVal) return;
      var opts = {
        wallet: {
          spendUnconfirmed: newVal
        }
      };
      configService.set(opts, function(err) {
        $rootScope.$emit('Local/SpendUnconfirmedUpdated', newVal);
        if (err) $log.debug(err);
      });
    });

    var unwatchPushNotifications = $scope.$watch('pushNotifications', function(newVal, oldVal) {
      if (newVal == oldVal) return;
      var opts = {
        pushNotifications: {
          enabled: newVal
        }
      };
      configService.set(opts, function(err) {
        if (opts.pushNotifications.enabled)
          pushNotificationsService.enableNotifications(profileService.walletClients);
        else
          pushNotificationsService.disableNotifications(profileService.walletClients);
        if (err) $log.debug(err);
      });
    });

    var unwatchGlideraEnabled = $scope.$watch('glideraEnabled', function(newVal, oldVal) {
      if (newVal == oldVal) return;
      var opts = {
        glidera: {
          enabled: newVal
        }
      };
      configService.set(opts, function(err) {
        $rootScope.$emit('Local/GlideraUpdated');
        if (err) $log.debug(err);
      });
    });

    var unwatchCoinbaseEnabled = $scope.$watch('coinbaseEnabled', function(newVal, oldVal) {
      if (newVal == oldVal) return;
      var opts = {
        coinbase: {
          enabled: newVal
        }
      };
      configService.set(opts, function(err) {
        $rootScope.$emit('Local/CoinbaseUpdated');
        if (err) $log.debug(err);
      });
    });

    $scope.$on('$destroy', function() {
      unwatchSpendUnconfirmed();
      unwatchGlideraEnabled();
      unwatchCoinbaseEnabled();
      unwatchPushNotifications();
    });
  });
