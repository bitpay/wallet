'use strict';

angular.module('copayApp.controllers').controller('preferencesEmailController', function($rootScope, $scope, $state, $stateParams, profileService, walletService) {

  $scope.save = function(form) {
    var wallet = profileService.getWallet($stateParams.walletId);
    var email = $scope.email || '';

    walletService.updateRemotePreferences(wallet, {
      email: email,
    }, function(err) {
      if (err) $log.warn(err);
      $state.go('wallet.preferences');
    });
  };

});
