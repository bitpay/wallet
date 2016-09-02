'use strict';

angular.module('copayApp.controllers').controller('backupWarningController', function($scope, $state, $ionicPopup, $stateParams, profileService) {

  $scope.openPopup = function() {
    var backupWarningPopup = $ionicPopup.show({
      templateUrl: "views/includes/backupWarningPopup.html",
      scope: $scope,
    });

    $scope.close = function() {
      backupWarningPopup.close();
      $state.go('onboarding.backup', {
        fromOnboarding: true
      })
    };
  }
});
