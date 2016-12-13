'use strict';

angular.module('copayApp.controllers').controller('tabSettingsController', function($scope, $window, $ionicModal, $log, lodash, uxLanguage, platformInfo, profileService, feeService, configService, externalLinkService, bitpayCardService, storageService, glideraService, gettextCatalog) {

  var updateConfig = function() {
    var isCordova = platformInfo.isCordova;
    var isWP = platformInfo.isWP;
    var isWindowsPhoneApp = platformInfo.isWP && isCordova;

    $scope.usePushNotifications = isCordova && !isWP;
    $scope.isCordova = isCordova;

    $scope.appName = $window.appConfig.nameCase;
    $scope.currentLanguageName = uxLanguage.getCurrentLanguageName();
    $scope.feeOpts = feeService.feeOpts;
    $scope.currentFeeLevel = feeService.getCurrentFeeLevel();
    
    $scope.wallets = profileService.getWallets();
    
    configService.whenAvailable(function(config) {
      $scope.unitName = config.wallet.settings.unitName;
      $scope.selectedAlternative = {
        name: config.wallet.settings.alternativeName,
        isoCode: config.wallet.settings.alternativeIsoCode
      };

      $scope.bitpayCardEnabled = config.bitpayCard.enabled;
      $scope.glideraEnabled = config.glidera.enabled && !isWindowsPhoneApp;

      if ($scope.bitpayCardEnabled) {
        bitpayCardService.getBitpayDebitCards(function(err, data) {
          if (err) $log.error(err);
          if (!lodash.isEmpty(data)) {
            $scope.bitpayCards = true;
          }
        });  
      }

      if ($scope.glideraEnabled) {
        storageService.getGlideraToken(glideraService.getEnvironment(), function(err, token) {
          if (err) $log.error(err);
          $scope.glideraToken = token;
        });
      }

    });
  };

  $scope.openExternalLink = function() {
    var url = 'https://help.bitpay.com/bitpay-app';
    var optIn = true;
    var title = gettextCatalog.getString('BitPay Help Center');
    var message = gettextCatalog.getString('Help and support information is available at the BitPay Help Center website. Would you like to go there now?');
    var okText = gettextCatalog.getString('Open Help Center');
    var cancelText = gettextCatalog.getString('Go Back');
    externalLinkService.open(url, optIn, title, message, okText, cancelText);
  };

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    updateConfig();
  });

});
