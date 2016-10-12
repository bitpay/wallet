'use strict';

angular.module('copayApp.controllers').controller('preferencesAbout',
  function($scope, $window, gettextCatalog, externalLinkService) {

    $scope.title = gettextCatalog.getString('About') + ' ' + $window.appConfig.nameCase;
    $scope.version = $window.version;
    $scope.commitHash = $window.commitHash;
    $scope.name = $window.appConfig.gitHubRepoName;

    $scope.openExternalLink = function(url, optIn, title, message, okText, cancelText) {
      externalLinkService.open(url, optIn, title, message, okText, cancelText);
    };
  });
