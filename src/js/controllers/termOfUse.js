'use strict';

angular.module('copayApp.controllers').controller('termOfUseController',
  function($scope, appConfigService, uxLanguage, externalLinkService) {
    $scope.lang = uxLanguage.currentLanguage;
    $scope.disclaimerUrl = appConfigService.disclaimerUrl;

    $scope.openExternalLink = function(url, target) {
      externalLinkService.open(url, target);
    };
  });
