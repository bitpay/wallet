'use strict';

angular.module('copayApp.controllers').controller('tabSettingsController', function($scope, $window, $ionicModal, uxLanguage, platformInfo, profileService, feeService, configService, externalLinkService) {

  var updateConfig = function() {

    var config = configService.getSync();
    var isCordova = platformInfo.isCordova;
    var isWP = platformInfo.isWP;

    $scope.usePushNotifications = isCordova && !isWP;

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
  };

  $scope.openExternalLink = function(url, optIn, title, message, okText, cancelText) {
    externalLinkService.open(url, optIn, title, message, okText, cancelText);
  };

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    updateConfig();
  });

  $scope.openRateModal = function() {
    $scope.isModal = true;
    $ionicModal.fromTemplateUrl('views/feedback/rateCard.html', {
      scope: $scope,
      backdropClickToClose: false,
      hardwareBackButtonClose: false
    }).then(function(modal) {
      $scope.rateModal = modal;
      $scope.rateModal.show();
    });
  }
});
