'use strict';

angular.module('copayApp.controllers').controller('collectEmailController', function($scope, $state, $stateParams, profileService, configService, walletService, platformInfo) {

  var isCordova = platformInfo.isCordova;
  var isWP = platformInfo.isWP;
  var usePushNotifications = isCordova && !isWP;

  var wallet = profileService.getWallet($stateParams.walletId);
  var walletId = wallet.credentials.walletId;

  var config = configService.getSync();
  config.emailFor = config.emailFor || {};
  $scope.email = config.emailFor && config.emailFor[walletId];

  $scope.save = function(form) {
    var opts = {
      emailFor: {}
    };
    opts.emailFor[walletId] = $scope.email;

    walletService.updateRemotePreferences(wallet, {
      email: $scope.email,
    }, function(err) {
      if (err) $log.warn(err);
      configService.set(opts, function(err) {
        if (err) $log.warn(err);
        if (!usePushNotifications) $state.go('onboarding.backupRequest');
        else $state.go('onboarding.notifications');
      });
    });
  };
});
