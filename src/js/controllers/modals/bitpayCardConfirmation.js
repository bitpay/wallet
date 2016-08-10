'use strict';

angular.module('copayApp.controllers').controller('bitpayCardConfirmationController', function($scope, $timeout, go, bitpayCardService) {

  $scope.ok = function() {
    bitpayCardService.logout(function() {
      go.path('bitpayCard');
    });
    $scope.cancel();
  };

  $scope.cancel = function() {
    $scope.bitpayCardConfirmationModal.hide();
  };

});
