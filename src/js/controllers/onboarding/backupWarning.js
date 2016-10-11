'use strict';

angular.module('copayApp.controllers').controller('backupWarningController', function($scope, $state, $timeout, $stateParams, $ionicModal) {

  $scope.walletId = $stateParams.walletId;
  $scope.fromState = $stateParams.from == 'onboarding' ? $stateParams.from + '.backupRequest' : $stateParams.from;
  $scope.toState = $scope.fromState + ".backup";

  $scope.openPopup = function() {
    $ionicModal.fromTemplateUrl('views/includes/screenshotWarningModal.html', {
      scope: $scope,
      backdropClickToClose: false,
      hardwareBackButtonClose: false
    }).then(function(modal) {
      $scope.warningModal = modal;
      $scope.warningModal.show();
    });

    $scope.close = function() {
      $scope.warningModal.hide();
      $scope.warningModal.remove();
      $state.go($scope.toState, {
        walletId: $scope.walletId
      });
    };
  }

  $scope.goBack = function() {
    $state.go($scope.fromState, {
      walletId: $scope.walletId
    });
  };

});
