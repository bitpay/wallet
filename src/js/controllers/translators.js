'use strict';

angular.module('copayApp.controllers').controller('translatorsController',
  function($scope, externalLinkService) {
    $scope.openExternalLink = function(url, target) {
      externalLinkService.open(url, target);
    };
  });
