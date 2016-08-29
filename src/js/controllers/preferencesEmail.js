'use strict';

angular.module('copayApp.controllers').controller('preferencesEmailController', function($rootScope, $scope, $ionicHistory, $stateParams, $ionicNavBarDelegate, gettextCatalog, profileService, walletService) {
  $ionicNavBarDelegate.title(gettextCatalog.getString('Email Notifications'));
  $scope.save = function(form) {
    var wallet = profileService.getWallet($stateParams.walletId);
    var email = $scope.email || '';

    walletService.updateRemotePreferences(wallet, {
      email: email,
    }, function(err) {
      if (err) $log.warn(err);
      $ionicHistory.goBack();
    });
  };

});
