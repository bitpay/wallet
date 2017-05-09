'use strict';

angular.module('copayApp.controllers').controller('pinTestController', function($scope, applicationService) {

  $scope.goodPin = function() {
    applicationService.successfullUnlocked = true;
    $scope.pintestview.hide();
  };

  $scope.badPin = function() {};

});
