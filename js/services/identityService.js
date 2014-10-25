'use strict';

angular.module('copayApp.services')
.factory('identityService', function($rootScope, $location, pluginManager, controllerUtils) {
  var root = {};

  root.check = function (scope) {
    copay.Identity.anyProfile({
      pluginManager: pluginManager,
    }, function(anyProfile) {
      copay.Identity.anyWallet({
        pluginManager: pluginManager,
      }, function(anyWallet) {
        scope.retreiving = false;
        scope.anyProfile = anyProfile ? true : false;
        scope.anyWallet = anyWallet ? true : false;

        if (!scope.anyProfile) {
          $location.path('/createProfile');
        }
      });
    });
  };

  root.create = function (scope, form) {
    copay.Identity.create(form.email.$modelValue, form.password.$modelValue, {
      pluginManager: pluginManager,
      network: config.network,
      networkName: config.networkName,
      walletDefaults: config.wallet,
      passphraseConfig: config.passphraseConfig,
    }, function(err, iden, firstWallet) {
      controllerUtils.bindProfile(scope, iden, firstWallet);
      scope.loading = false;
    });
  };


  root.open = function (scope, form) {
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
        scope, (err.toString() || '').match('PNOTFOUND') ? 'Profile not found' : 'Unknown error');
      } else {
        controllerUtils.bindProfile(scope, iden, lastFocusedWallet);
      }
      scope.loading = false;
    });
  }

  return root;
});

