'use strict';

angular.module('copayApp.controllers').controller('backController', function($scope, $state, $stateParams) {

  $scope.importGoBack = function() {
    if ($stateParams.fromOnboarding) $state.go('onboarding.welcome');
    else $state.go('add.main');
  };

});
