'use strict';

angular.module('copayApp.controllers').controller('termOfUseController',
  function($scope, $window, uxLanguage, gettextCatalog, externalLinkService) {
    $scope.lang = uxLanguage.currentLanguage;
    $scope.disclaimerUrl = $window.appConfig.disclaimerUrl;

    $scope.openExternalLink = function(url, target) {
      externalLinkService.open(url, target);
    };
  });
