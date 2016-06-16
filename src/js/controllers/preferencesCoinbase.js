'use strict';

angular.module('copayApp.controllers').controller('preferencesCoinbaseController',
  function($scope, $timeout, $ionicModal, applicationService, coinbaseService) {

    this.revokeToken = function(testnet) {
      $scope.network = testnet ? 'testnet' : 'livenet';

      $ionicModal.fromTemplateUrl('views/modals/coinbase-confirmation.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(modal) {
        $scope.coinbaseConfirmationModal = modal;
        $scope.coinbaseConfirmationModal.show();
      });
    };

  });
