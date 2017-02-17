'use strict';

angular.module('copayApp.controllers').controller('termsController', function($scope, $log, $state, appConfigService, uxLanguage, profileService, externalLinkService, gettextCatalog) {
  $scope.lang = uxLanguage.currentLanguage;

  $scope.confirm = function() {
    profileService.setDisclaimerAccepted(function(err) {
      if (err) $log.error(err);
      else {
        $state.go('tabs.home', {
          fromOnboarding: true
        });
      }
    });
  };

  $scope.openExternalLink = function() {
    var url = appConfigService.disclaimerUrl;
    var optIn = true;
    var title = gettextCatalog.getString('View Terms of Service');
    var message = gettextCatalog.getString('The official English Terms of Service are available on the BitPay website.');
    var okText = gettextCatalog.getString('Open Website');
    var cancelText = gettextCatalog.getString('Go Back');
    externalLinkService.open(url, optIn, title, message, okText, cancelText);
  };

});
