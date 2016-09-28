'use strict';

angular.module('copayApp.controllers').controller('tabSettingsController', function($scope, $rootScope, $log, $window, lodash, configService, uxLanguage, platformInfo, pushNotificationsService, profileService, feeService) {

  var updateConfig = function() {

    var config = configService.getSync();
    var isCordova = platformInfo.isCordova;
    var isWP = platformInfo.isWP;
    var isIOS = platformInfo.isIOS;

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

    $scope.otherWallets = lodash.filter(profileService.getWallets(self.network), function(w) {
      return w.id != self.walletId;
    });
    $scope.wallets = profileService.getWallets();
  };

  $scope.$on("$ionicView.enter", function(event, data) {
    updateConfig();
  });

});
