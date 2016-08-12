'use strict';

angular.module('copayApp.controllers').controller('tabSendController', function($scope, $ionicModal) {

  $scope.openInputAmountModal = function(addr) {
    $ionicModal.fromTemplateUrl('views/modals/inputAmount.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.inputAmountModal = modal;
      $scope.inputAmountModal.show();
    });
  };

  $scope.options = {
    loop: false,
    effect: 'fade',
    speed: 500,
  };

  $scope.$on("$ionicSlides.slideChangeEnd", function(event, data) {
    // note: the indexes are 0-based
    console.log('CHANGEDD');
  });
});
