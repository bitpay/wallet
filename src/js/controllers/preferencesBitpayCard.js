'use strict';

angular.module('copayApp.controllers').controller('preferencesBitpayCardController',
  function($scope, $ionicModal, bitpayCardService) {

    this.logout = function() {
      $ionicModal.fromTemplateUrl('views/modals/bitpay-card-confirmation.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(modal) {
        $scope.bitpayCardConfirmationModal = modal;
        $scope.bitpayCardConfirmationModal.show();
      });
    };

  });
