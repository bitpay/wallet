'use strict';

angular.module('copayApp.controllers').controller('HomeController', function($scope, $rootScope, $location, notification, controllerUtils, pluginManager) {
  controllerUtils.redirIfLogged();

  $scope.retreiving = false;

  $scope.openProfile = function(form) {
    if (form && form.$invalid) {
      notification.error('Error', 'Please enter the required fields');
      return;
    }
    $scope.loading = true;
    copay.Identity.open(form.email.$modelValue, form.password.$modelValue, {
      pluginManager: pluginManager,
      network: config.network,
      networkName: config.networkName,
      walletDefaults: config.wallet,
      passphraseConfig: config.passphraseConfig,
    }, function(err, iden, lastFocusedWallet) {
      if (err && !iden) {
        console.log('Error:' + err)
        controllerUtils.onErrorDigest(
          $scope, (err.toString() || '').match('PNOTFOUND') ? 'Profile not found' : 'Unknown error');
      } else {
        controllerUtils.bindProfile($scope, iden, lastFocusedWallet);
      }
    });
  }
});
