'use strict';

angular.module('copayApp.services')
.factory('identityService', function($rootScope, $location, pluginManager, controllerUtils) {
  var root = {};

  root.checkIdentity = function (scope) {
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

  root.createIdentity = function (scope, form) {
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

  return root;
});

