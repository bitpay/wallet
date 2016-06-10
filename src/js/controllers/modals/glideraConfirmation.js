'use strict';

angular.module('copayApp.controllers').controller('glideraConfirmationController', function($scope, $timeout, storageService, applicationService) {

  $scope.ok = function() {
    storageService.removeGlideraToken($scope.network, function() {
      $timeout(function() {
        applicationService.restart();
      }, 100);
    });
    $scope.cancel();
  };

  $scope.cancel = function() {
    $scope.glideraConfirmationModal.hide();
  };

});
