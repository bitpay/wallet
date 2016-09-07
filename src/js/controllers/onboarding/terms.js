'use strict';

angular.module('copayApp.controllers').controller('termsController', function($scope, $log, $state, uxLanguage, profileService, externalLinkService) {
  $scope.lang = uxLanguage.currentLanguage;
  $scope.disclaimerUrl = $window.appConfig.disclaimerUrl;

  $scope.confirm = function() {
    profileService.setDisclaimerAccepted(function(err) {
      if (err) $log.error(err);
      else {
        $state.go('tabs.home');
      }
    });
  };

  $scope.openExternalLink = function(url, target) {
    externalLinkService.open(url, target);
  };

});
