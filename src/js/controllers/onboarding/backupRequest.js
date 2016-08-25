'use strict';

angular.module('copayApp.controllers').controller('backupRequestController', function($rootScope, $scope, $state, $ionicPopup, $stateParams, profileService, walletService) {

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
