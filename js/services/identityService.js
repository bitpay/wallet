'use strict';

angular.module('copayApp.services')
.factory('identityService', function($rootScope, $location, pluginManager, controllerUtils) {
  var root = {};

  root.create = function (scope, form) {
    copay.Identity.create({
      email: form.email.$modelValue,
      password: form.password.$modelValue,
      pluginManager: pluginManager,
      network: config.network,
      networkName: config.networkName,
      walletDefaults: config.wallet,
      passphraseConfig: config.passphraseConfig,
    }, function(err, iden) {
      var firstWallet = iden.getLastFocusedWallet();
      controllerUtils.bindProfile(scope, iden, firstWallet);
      scope.loading = false;
    });
  };


  root.open = function (scope, form) {
    copay.Identity.open({
      email: form.email.$modelValue,
      password: form.password.$modelValue, 
      pluginManager: pluginManager,
      network: config.network,
      networkName: config.networkName,
      walletDefaults: config.wallet,
      passphraseConfig: config.passphraseConfig,
    }, function(err, iden) {
      if (err && !iden) {
        console.log('Error:' + err)
      controllerUtils.onErrorDigest(
        scope, (err.toString() || '').match('PNOTFOUND') ? 'Profile not found' : 'Unknown error');
      } else {
        var firstWallet = iden.getLastFocusedWallet();
        controllerUtils.bindProfile(scope, iden, firstWallet);
      }
      scope.loading = false;
    });
  }

  return root;
});

