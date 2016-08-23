'use strict';

angular.module('copayApp.controllers').controller('bitpayCardConfirmationController', function($scope, $timeout, $state, bitpayCardService) {

  $scope.ok = function() {
    bitpayCardService.logout(function() {
      $state.go('bitpayCard.main');
    });
    $scope.cancel();
  };

  $scope.cancel = function() {
    $scope.bitpayCardConfirmationModal.hide();
  };

});
