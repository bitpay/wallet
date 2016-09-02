'use strict';

angular.module('copayApp.controllers').controller('backupRequestController', function($scope, $state, $stateParams, $ionicPopup) {

  $scope.walletId = $stateParams.walletId;
  $scope.openPopup = function() {
    var backupLaterPopup = $ionicPopup.show({
      templateUrl: "views/includes/backupLaterPopup.html",
      scope: $scope,
    });

    $scope.goBack = function() {
      backupLaterPopup.close();
    };

    $scope.continue = function() {
      backupLaterPopup.close();
      $state.go('onboarding.disclaimer');
    };
  }

});
