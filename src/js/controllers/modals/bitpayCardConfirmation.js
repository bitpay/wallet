'use strict';

angular.module('copayApp.controllers').controller('bitpayCardConfirmationController', function($scope, $timeout, $location, bitpayCardService) {

  $scope.ok = function() {
    bitpayCardService.logout(function() {
      $location.path('/bitpayCard/main');
    });
    $scope.cancel();
  };

  $scope.cancel = function() {
    $scope.bitpayCardConfirmationModal.hide();
  };

});
