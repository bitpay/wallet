'use strict';

angular.module('copayApp.controllers').controller('tabSettingsController', function($scope, $window, $ionicModal, lodash, uxLanguage, platformInfo, profileService, feeService, configService, externalLinkService, bitpayCardService) {

  var updateConfig = function() {

    var config = configService.getSync();
    var isCordova = platformInfo.isCordova;
    var isWP = platformInfo.isWP;

    $scope.usePushNotifications = isCordova && !isWP;
    $scope.isCordova = isCordova;

    $scope.appName = $window.appConfig.nameCase;

    $scope.unitName = config.wallet.settings.unitName;
    $scope.currentLanguageName = uxLanguage.getCurrentLanguageName();
    $scope.selectedAlternative = {
      name: config.wallet.settings.alternativeName,
      isoCode: config.wallet.settings.alternativeIsoCode
    };
    $scope.feeOpts = feeService.feeOpts;
    $scope.currentFeeLevel = feeService.getCurrentFeeLevel();

    $scope.wallets = profileService.getWallets();

    $scope.bitpayCardEnabled = config.bitpayCard.enabled;
  };

  $scope.openExternalLink = function(url, optIn, title, message, okText, cancelText) {
    externalLinkService.open(url, optIn, title, message, okText, cancelText);
  };

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    updateConfig();

    bitpayCardService.getBitpayDebitCards(function(err, data) {
      if (!lodash.isEmpty(data)) {
        $scope.bitpayCards = true;
      }
    });
  });

});
