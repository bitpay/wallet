'use strict';

angular.module('copayApp.controllers').controller('HomeController', function($scope, $rootScope, $location, notification, controllerUtils, pluginManager) {

  controllerUtils.redirIfLogged();

  $scope.openProfile = function(form) {
    $scope.loading = true;
    copay.Identity.open(form.email.$modelValue, form.password.$modelValue, {
      pluginManager: pluginManager,
      network: config.network,
      networkName: config.networkName,
      walletDefaults: config.wallet,
      passphrase: config.passphrase,
    }, function(err, iden, firstWallet) {
      if (err && !iden) {
        console.log('Error:' + err)
        controllerUtils.onErrorDigest(
          $scope, (err.toString()||'').match('PNOTFOUND') ? 'Profile not found' : 'Unknown error');
      } else {
        controllerUtils.bindProfile($scope, iden, firstWallet);
      }
    });
  }
});
