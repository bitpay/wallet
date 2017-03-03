'use strict';

angular.module('copayApp.controllers').controller('disclaimerController', function($scope, $timeout, $state, $log, $ionicModal, $ionicConfig, profileService, uxLanguage, externalLinkService, storageService, $stateParams, startupService, $rootScope) {

  $scope.$on("$ionicView.afterEnter", function() {
    startupService.ready();
  });

  $scope.$on("$ionicView.beforeEnter", function() {
    $scope.lang = uxLanguage.currentLanguage;
    $scope.terms = {};
    $scope.accepted = {};
    $scope.accepted.first = $scope.accepted.second = $scope.accepted.third = false;
    $scope.backedUp = $stateParams.backedUp == 'false' ? false : true;
    $scope.resume = $stateParams.resume || false;
    $scope.shrinkView = false;
  });

  $scope.$on("$ionicView.enter", function() {
    if ($scope.backedUp || $scope.resume) $ionicConfig.views.swipeBackEnabled(false);
  });

  $scope.$on("$ionicView.beforeLeave", function() {
    $ionicConfig.views.swipeBackEnabled(true);
  });

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
