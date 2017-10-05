'use strict';

angular.module('copayApp.controllers').controller('mercadoLibreController',
  function($scope, $timeout, $log, mercadoLibreService, externalLinkService, popupService) {

    $scope.openExternalLink = function(url) {
      externalLinkService.open(url);
    };

    var init = function() {
      mercadoLibreService.getPendingGiftCards(function(err, gcds) {
        if (err) $log.error(err);
        $scope.giftCards = gcds;
        $timeout(function() {
          $scope.$digest();
        });
      });
    };

    $scope.$on("$ionicView.beforeEnter", function(event, data) {
      $scope.network = mercadoLibreService.getNetwork();
      init();
    });
  });
