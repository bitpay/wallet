'use strict';

angular.module('copayApp.controllers').controller('translatorsController',
  function($scope, externalLinkService, gettextCatalog) {
    $scope.openExternalLink = function() {
      var url = 'https://crowdin.com/project/copay';
      var optIn = true;
      var title = gettextCatalog.getString('Open Translation Community');
      var message = gettextCatalog.getString('You can make contributions by signing up on our Crowdin community translation website. We’re looking forward to hearing from you!');
      var okText = gettextCatalog.getString('Open Crowdin');
      var cancelText = gettextCatalog.getString('Go Back');
      externalLinkService.open(url, optIn, title, message, okText, cancelText);
    };
  });
