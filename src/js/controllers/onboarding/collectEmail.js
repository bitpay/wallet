'use strict';

angular.module('copayApp.controllers').controller('collectEmailController', function($scope, $state, $stateParams, profileService, walletService, platformInfo) {

  $scope.skip = function() {
    if (!platformInfo.isCordova) $state.go('onboarding.backupRequest');
    else $state.go('onboarding.notifications');
  }

  $scope.save = function(form) {
    var wallet = profileService.getWallet($stateParams.walletId);
    var email = $scope.email || '';

    walletService.updateRemotePreferences(wallet, {
      email: email,
    }, function(err) {
      if (err) $log.warn(err);
      if (!platformInfo.isCordova) $state.go('onboarding.backupRequest');
      else $state.go('onboarding.notifications');
    });
  };

});
