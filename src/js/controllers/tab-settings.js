'use strict';

angular.module('copayApp.controllers').controller('tabSettingsController', function($rootScope, $timeout, $scope, appConfigService, $ionicModal, $log, lodash, uxLanguage, platformInfo, profileService, feeService, configService, externalLinkService, bitpayAccountService, bitpayCardService, storageService, glideraService, gettextCatalog, buyAndSellService) {

  var updateConfig = function() {
    $scope.currentLanguageName = uxLanguage.getCurrentLanguageName();
    $scope.feeOpts = feeService.feeOpts;
    $scope.currentFeeLevel = feeService.getCurrentFeeLevel();
    $scope.wallets = profileService.getWallets();
    $scope.buyAndSellServices = buyAndSellService.getLinked();

    configService.whenAvailable(function(config) {
      $scope.unitName = config.wallet.settings.unitName;
      $scope.selectedAlternative = {
        name: config.wallet.settings.alternativeName,
        isoCode: config.wallet.settings.alternativeIsoCode
      };

      // TODO move this to a generic service
      bitpayAccountService.getAccounts(function(err, data) {
        if (err) $log.error(err);
        $scope.bitpayAccounts = !lodash.isEmpty(data);

        $timeout(function() {
          $rootScope.$apply();
        }, 10);
      });

      // TODO move this to a generic service
      bitpayCardService.getCards(function(err, cards) {
        if (err) $log.error(err);
        $scope.bitpayCards = cards && cards.length > 0;

        $timeout(function() {
          $rootScope.$apply();
        }, 10);
      });
    });
  };

  $scope.openExternalLink = function() {
    var url = 'https://help.bitpay.com/bitpay-app';
    var optIn = true;
    var appName = appConfigService.name;
    var title = gettextCatalog.getString('{{msg}}', {
      msg: appName == 'copay' ? 'Copay Github Issues' : 'BitPay Help Center'
    });
    var message = gettextCatalog.getString('Help and support information is available at the {{msg}} website.', {
      msg: appName == 'copay' ? 'Copay Github Issues' : 'BitPay Help Center'
    });
    var okText = gettextCatalog.getString('Open');
    var cancelText = gettextCatalog.getString('Go Back');
    externalLinkService.open(url, optIn, title, message, okText, cancelText);
  };

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    $scope.isCordova = platformInfo.isCordova;
    $scope.appName = appConfigService.nameCase;
  });

  $scope.$on("$ionicView.enter", function(event, data) {
    updateConfig();
  });

});
