'use strict';

angular.module('copayApp.controllers').controller('thanksController', function($scope, $state, $stateParams, platformInfo, configService) {
  $scope.score = parseInt($stateParams.score);
  $scope.skip = $stateParams.skip && $scope.score == 5;

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    if (platformInfo.isCordova) {
      var config = configService.getSync();
      window.plugins.socialsharing.share(config.download.url, null, null, null);
    }
  });
});
