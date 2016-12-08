'use strict';

angular.module('copayApp.controllers').controller('translatorsController',
  function($scope, externalLinkService) {
    $scope.openExternalLink = function(url, optIn, title, message, okText, cancelText) {
      externalLinkService.open(url, optIn, title, message, okText, cancelText);
    };
  });
