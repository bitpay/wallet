'use strict';

angular.module('copayApp.controllers').controller('tabSettingsController', function($scope, $rootScope, $log, $ionicModal, lodash, configService, uxLanguage, platformInfo, pushNotificationsService, profileService, feeService) {

  $scope.init = function() {

    var config = configService.getSync();
    var isCordova = platformInfo.isCordova;
    var isWP = platformInfo.isWP;
    var isIOS = platformInfo.isIOS;

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
    if (isCordova && StatusBar.isVisible) {
      StatusBar.backgroundColorByHexString("#4B6178");
    }
    $scope.otherWallets = lodash.filter(profileService.getWallets(self.network), function(w) {
      return w.id != self.walletId;
    });
  };

  $scope.openAddressbookModal = function() {

    $ionicModal.fromTemplateUrl('views/modals/addressbook.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.addressbookModal = modal;
      $scope.addressbookModal.show();
    });
  };


  $scope.openSettings = function() {
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

});
