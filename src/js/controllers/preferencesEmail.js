'use strict';

angular.module('copayApp.controllers').controller('preferencesEmailController', function($scope, $ionicHistory, $stateParams, $ionicNavBarDelegate, gettextCatalog, profileService, walletService, configService) {
  $ionicNavBarDelegate.title(gettextCatalog.getString('Email Notifications'));

  var wallet = profileService.getWallet($stateParams.walletId);
  var walletId = wallet.credentials.walletId;

  var config = configService.getSync();
  config.emailFor = config.emailFor || {};
  $scope.email = config.emailFor && config.emailFor[walletId];

  $scope.save = function(form) {
    var email = $scope.email || '';
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
        $ionicHistory.goBack();
      });
    });
  };
});
