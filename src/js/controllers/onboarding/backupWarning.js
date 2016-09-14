'use strict';

angular.module('copayApp.controllers').controller('backupWarningController', function($scope, $state, $timeout, $stateParams, $ionicPopup, profileService) {

  $scope.walletId = $stateParams.walletId;
  $scope.openPopup = function() {
    var backupWarningPopup = $ionicPopup.show({
      templateUrl: "views/includes/backupWarningPopup.html",
      scope: $scope,
    });

    $scope.close = function() {
      backupWarningPopup.close();
      $state.go('onboarding.backup', {
        walletId: $stateParams.walletId,
        fromOnboarding: true
      });
    };
  }
});
