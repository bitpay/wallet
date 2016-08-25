'use strict';

angular.module('copayApp.controllers').controller('collectEmailController', function($rootScope, $scope, $state, $stateParams, $timeout, $ionicModal, profileService, walletService) {

  $scope.save = function(form) {
    var wallet = profileService.getWallet($stateParams.walletId);
    var email = $scope.email || '';

    walletService.updateRemotePreferences(wallet, {
      email: email,
    }, function(err) {
      if (err) $log.warn(err);
      $state.go('onboarding.notifications');
    });
  };

});
