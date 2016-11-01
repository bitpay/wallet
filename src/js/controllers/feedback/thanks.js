'use strict';

angular.module('copayApp.controllers').controller('thanksController', function($scope, $state, $stateParams) {
  $scope.score = parseInt($stateParams.score);
  $scope.skip = $stateParams.skip && $scope.score == 5;
});
