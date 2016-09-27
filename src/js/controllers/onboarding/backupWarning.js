'use strict';

angular.module('copayApp.controllers').controller('backupWarningController', function($scope, $state, $timeout, $stateParams, profileService, $ionicModal) {

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
      if ($stateParams.from == 'onboarding.backupRequest')
        $state.go('onboarding.backup', {
          walletId: $stateParams.walletId
        });
      else
        $state.go($stateParams.from + '.backup', {
          walletId: $stateParams.walletId
        });
    };
  }

  $scope.goBack = function() {
    $state.go($stateParams.from, {
      walletId: $stateParams.walletId
    });
  };

});
