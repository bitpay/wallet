'use strict';

angular.module('copayApp.controllers').controller('termsController', function($scope, $log, $state, $window, uxLanguage, profileService, externalLinkService) {
  $scope.lang = uxLanguage.currentLanguage;
  $scope.disclaimerUrl = $window.appConfig.disclaimerUrl;

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

  $scope.openExternalLink = function(url, optIn, title, message, okText, cancelText) {
    externalLinkService.open(url, optIn, title, message, okText, cancelText);
  };

});
