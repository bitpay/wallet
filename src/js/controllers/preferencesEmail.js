'use strict';

angular.module('copayApp.controllers').controller('preferencesEmailController', function($scope, $ionicHistory, $stateParams, gettextCatalog, profileService, walletService, configService) {

  $scope.wallet = profileService.getWallet($stateParams.walletId);
  var walletId = $scope.wallet.credentials.walletId;

  var config = configService.getSync();
  config.emailFor = config.emailFor || {};
  $scope.emailForExist = config.emailFor && config.emailFor[walletId];
  $scope.email = {
    value: config.emailFor && config.emailFor[walletId]
  };


  $scope.save = function(val) {
    var opts = {
      emailFor: {}
    };
    opts.emailFor[walletId] = val;

    walletService.updateRemotePreferences($scope.wallet, {
      email: val,
    }, function(err) {
      if (err) $log.warn(err);
      configService.set(opts, function(err) {
        if (err) $log.warn(err);
        $ionicHistory.goBack();
      });
    });
  };
});
