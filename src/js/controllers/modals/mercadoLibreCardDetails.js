'use strict';

angular.module('copayApp.controllers').controller('mercadoLibreCardDetailsController', function($scope, mercadoLibreService, externalLinkService) {

  $scope.remove = function() {
    mercadoLibreService.savePendingGiftCard($scope.card, {
      remove: true
    }, function(err) {
      $scope.close();
    });
  };

  $scope.close = function() {
    $scope.mercadoLibreCardDetailsModal.hide();
  };

  $scope.openExternalLink = function(url) {
    externalLinkService.open(url);
  };

});
