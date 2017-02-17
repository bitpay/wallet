'use strict';

angular.module('copayApp.controllers').controller('amazonController',
  function($scope, $timeout, $ionicModal, $log, $state, $ionicHistory, lodash, amazonService, externalLinkService, popupService) {

    $scope.openExternalLink = function(url) {
      externalLinkService.open(url);
    };

    var initAmazon = function() {
      amazonService.getPendingGiftCards(function(err, gcds) {
        if (err) $log.error(err);
        $scope.giftCards = gcds;
        $timeout(function() {
          $scope.$digest();
        });
      });
    };

    $scope.$on("$ionicView.beforeEnter", function(event, data) {
      $scope.network = amazonService.getNetwork();
      initAmazon();
    });
  });
