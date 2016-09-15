'use strict';

angular.module('copayApp.controllers').controller('backupWarningController', function($scope, $state, $timeout, $stateParams, $ionicPopup, profileService, $ionicModal) {

  $scope.walletId = $stateParams.walletId;
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
      $state.go('onboarding.backup', {
        walletId: $stateParams.walletId,
        fromOnboarding: true
      });
    };
  }
});
