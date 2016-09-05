'use strict';

angular.module('copayApp.controllers').controller('preferencesAbout',
  function($scope, $window, $ionicNavBarDelegate, gettextCatalog, externalLinkService) {
    $ionicNavBarDelegate.title(gettextCatalog.getString('About') + ' ' + $window.appConfig.nameCase);

    $scope.version = $window.version;
    $scope.commitHash = $window.commitHash;
    $scope.name = $window.appConfig.gitHubRepoName;

    $scope.openExternalLink = function(url, target) {
      externalLinkService.open(url, target);
    };
  });
