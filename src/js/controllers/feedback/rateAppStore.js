'use strict';

angular.module('copayApp.controllers').controller('rateAppStoreController', function($scope, $state, $stateParams) {
  $scope.score = parseInt($stateParams.score);

  $scope.skip = function() {
    $state.go('feedback.thanks', {
      score: $scope.score,
      skip: true
    });
  };

  $scope.sendFeedback = function() {
    $state.go('feedback.sendFeedback', {
      score: $scope.score
    });
  };

  $scope.goAppStore = function() {

  };
});
