'use strict';

angular.module('copayApp.controllers').controller('disclaimerController', function($scope, $timeout, $state, $log, $ionicModal, profileService, uxLanguage, externalLinkService, storageService, $stateParams, startupService, $rootScope) {

  $scope.$on("$ionicView.afterEnter", function() {
    startupService.ready();
  });
  $scope.init = function() {
    $scope.lang = uxLanguage.currentLanguage;
    $scope.terms = {};
    $scope.accepted = {};
    $scope.accepted.first = $scope.accepted.second = $scope.accepted.third = false;
    $scope.backedUp = $stateParams.backedUp;
    $scope.resume = $stateParams.resume;
    $scope.shrinkView = false;
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

  $scope.openTerms = function() {
    $scope.shrinkView = !$scope.shrinkView;
  }

  $scope.goBack = function() {
    $state.go('onboarding.backupRequest', {
      walletId: $stateParams.walletId
    });
  }


});
