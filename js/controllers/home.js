'use strict';

angular.module('copayApp.controllers').controller('HomeController', function($scope, $rootScope, $location, notification, controllerUtils, pluginManager) {
  controllerUtils.redirIfLogged();

  $scope.retreiving = true;
  copay.Identity.anyProfile({
    pluginManager: pluginManager,
  }, function(any) {
    $scope.retreiving = false;
    if (!any)
      $location.path('/createProfile');
  });


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
    }, function(err, iden, firstWallet) {
      if (err && !iden) {
        console.log('Error:' + err)
        controllerUtils.onErrorDigest(
          $scope, (err.toString() || '').match('PNOTFOUND') ? 'Profile not found' : 'Unknown error');
      } else {
        console.log('$rootScope.wallet -->', $rootScope.wallet, 'FIRST WALLET ->', firstWallet);
        controllerUtils.bindProfile($scope, iden, firstWallet);
      }
    });
  }
});
