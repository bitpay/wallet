'use strict';

angular.module('copayApp.controllers').controller('disclaimerController', function($scope, $timeout, $state, $log, $ionicModal, profileService, uxLanguage, externalLinkService, storageService, $stateParams) {
  $scope.init = function() {
    $scope.lang = uxLanguage.currentLanguage;
    $scope.terms = {};
    $scope.accept1 = $scope.accept2 = $scope.accept3 = false;
    $scope.backedUp = $stateParams.backedUp;
    $timeout(function() {
      $scope.$apply();
    }, 1);
  };

  $scope.confirm = function() {
    profileService.setDisclaimerAccepted(function(err) {
      if (err) $log.error(err);
      else {
        $state.go('tabs.home', {
          fromOnboarding: true
        });
      }
    });
  };

  $scope.openExternalLink = function(url, target) {
    externalLinkService.open(url, target);
  };

  $scope.openTermsModal = function() {
    $ionicModal.fromTemplateUrl('views/modals/terms.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.termsModal = modal;
      $scope.termsModal.show();
    });
  };

  $scope.goBack = function(){
    $state.go('onboarding.backupRequest');
  }


});
