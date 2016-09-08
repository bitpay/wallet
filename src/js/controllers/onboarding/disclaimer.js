'use strict';

angular.module('copayApp.controllers').controller('disclaimerController', function($scope, $timeout, $state, $log, $ionicModal, profileService) {

  $scope.init = function() {
    $scope.terms = {};
    $scope.accept1 = $scope.accept2 = $scope.accept3 = false;
    $timeout(function() {
      $scope.$apply();
    }, 1);
  };

  $scope.confirm = function() {
    profileService.setDisclaimerAccepted(function(err) {
      if (err) $log.error(err);
      else {
        $state.go('tabs.home');
      }
    });
  };

  $scope.openTermsModal = function() {
    $ionicModal.fromTemplateUrl('views/modals/terms.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.termsModal = modal;
      $scope.termsModal.show();
    });
  };
});
