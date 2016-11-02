'use strict';

angular.module('copayApp.controllers').controller('thanksController', function($scope, $stateParams, configService, storageService) {
  $scope.score = parseInt($stateParams.score);
  $scope.skip = $stateParams.skip && $scope.score == 5;
  storageService.setRateCardFlag('true', function() {});

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    var config = configService.getSync();
    window.plugins.socialsharing.share(config.download.url, null, null, null);
  });
});
