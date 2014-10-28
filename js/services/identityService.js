'use strict';

angular.module('copayApp.services')
  .factory('identityService', function($rootScope, $location, pluginManager, controllerUtils) {
    var root = {};

    root.create = function(scope, form) {
      var iden = copay.Identity.create({
        email: form.email.$modelValue,
        password: form.password.$modelValue,
        pluginManager: pluginManager,
        network: config.network,
        networkName: config.networkName,
        walletDefaults: config.wallet,
        passphraseConfig: config.passphraseConfig,
      });

      var walletOptions = {
        nickname: iden.fullName,
        networkName: config.networkName,
        requiredCopayers: 1,
        totalCopayers: 1,
        password: iden.password,
        name: 'My wallet',
      };
      iden.createWallet(walletOptions, function(err, wallet) {
        if (err) {
          console.log('Error:' + err)
          controllerUtils.onErrorDigest(
            scope, 'Could not create default wallet');
        } else {
          controllerUtils.bindProfile(scope, iden, wallet.id);
        }
        scope.loading = false;
      });
    };


    root.open = function(scope, form) {
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
