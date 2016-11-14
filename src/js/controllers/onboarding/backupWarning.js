'use strict';

angular.module('copayApp.controllers').controller('backupWarningController', function($scope, $state, $timeout, $stateParams, $ionicModal) {

  $scope.walletId = $stateParams.walletId;
  $scope.fromState = $stateParams.from == 'onboarding' ? $stateParams.from + '.backupRequest' : $stateParams.from;
  $scope.toState = $stateParams.from + '.backup';

  $scope.openPopup = function() {
    $ionicModal.fromTemplateUrl('views/includes/screenshotWarningModal.html', {
      scope: $scope,
    }).then(function(modal) {
      $scope.warningModal = modal;
      $scope.warningModal.show();
    });

    $scope.close = function() {
      $scope.warningModal.hide();
      $state.go($scope.toState, {
        walletId: $scope.walletId
      });
    };
  }

  $scope.$on('modal.hidden', function(modal) {
    $scope.warningModal.remove();
  });

  $scope.goBack = function() {
    $state.go($scope.fromState, {
      walletId: $scope.walletId
    });
  };

});
