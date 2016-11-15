'use strict';

angular.module('copayApp.controllers').controller('rateCardController', function($scope, $state, $timeout, gettextCatalog, platformInfo, storageService) {

  $scope.isCordova = platformInfo.isCordova;
  $scope.score = 0;

  $scope.goFeedbackFlow = function() {
    if ($scope.isModal) {
      $scope.rateModal.hide();
      $scope.rateModal.remove();
    }
    if ($scope.isCordova && $scope.score == 5) {
      $state.go('feedback.rateApp', {
        score: $scope.score
      });
    } else {
      $state.go('feedback.send', {
        score: $scope.score
      });
    }
  };

  $scope.setScore = function(score) {
    $scope.score = score;
    switch ($scope.score) {
      case 1:
        $scope.button_title = gettextCatalog.getString("I think this app is terrible.");
        break;
      case 2:
        $scope.button_title = gettextCatalog.getString("I don't like it");
        break;
      case 3:
        $scope.button_title = gettextCatalog.getString("Meh - it's alright");
        break;
      case 4:
        $scope.button_title = gettextCatalog.getString("I like the app");
        break;
      case 5:
        $scope.button_title = gettextCatalog.getString("This app is fantastic!");
        break;
    }
    $timeout(function() {
      $scope.$apply();
    });
  };

  $scope.hideCard = function() {
    if ($scope.isModal) {
      $scope.rateModal.hide();
      $scope.rateModal.remove();
    } else {
      storageService.getFeedbackInfo(function(error, info) {
        var feedbackInfo = JSON.parse(info);
        feedbackInfo.sent = true;
        storageService.setFeedbackInfo(JSON.stringify(feedbackInfo), function() {
          $scope.showRateCard.value = false;
        });
      });
    }
    $timeout(function() {
      $scope.$apply();
    }, 100);
  }

});
