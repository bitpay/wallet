'use strict';

angular.module('copayApp.controllers').controller('tabSettingsController', function($scope, $window, uxLanguage, profileService, feeService, configService, externalLinkService) {

  var updateConfig = function() {
    $scope.appName = $window.appConfig.nameCase;

    var config = configService.getSync();
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

});
