'use strict';

angular.module('copayApp.controllers').controller('preferencesAbout',
  function($scope, $window, appConfigService, gettextCatalog, externalLinkService) {

    $scope.title = gettextCatalog.getString('About') + ' ' + appConfigService.nameCase;
    $scope.version = $window.version;
    $scope.commitHash = $window.commitHash;

    $scope.openExternalLink = function() {
      var url = 'https://github.com/bitpay/' + appConfigService.gitHubRepoName + '/tree/' + $window.commitHash + '';
      var optIn = true;
      var title = gettextCatalog.getString('Open GitHub Project');
      var message = gettextCatalog.getString('You can see the latest developments and contribute to this open source app by visiting our project on GitHub.');
      var okText = gettextCatalog.getString('Open GitHub');
      var cancelText = gettextCatalog.getString('Go Back');
      externalLinkService.open(url, optIn, title, message, okText, cancelText);
    };
  });
