'use strict';

angular.module('copayApp.controllers').controller('thanksController', function($scope, $state, $stateParams, platformInfo) {
  $scope.score = parseInt($stateParams.score);
  $scope.skip = $stateParams.skip && $scope.score == 5;

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    if (platformInfo.isCordova) {
      window.plugins.socialsharing.share('https://bitpay.com/wallet', null, null, null);
    }
  });
});
