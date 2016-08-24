'use strict';

angular.module('copayApp.controllers').controller('glideraConfirmationController', function($scope, $timeout, $state, glideraService) {

  $scope.ok = function() {
    glideraService.removeToken(function() {
      $timeout(function() {
        $state.go('glidera.main');
      }, 100);
    });
    $scope.cancel();
  };

  $scope.cancel = function() {
    $scope.glideraConfirmationModal.hide();
  };

});
